// /src/app/api/admin/sync/products/route.ts

import { NextResponse, NextRequest } from 'next/server'; // ИЗМЕНЕНИЕ: Добавляем NextRequest
import prisma from '@/lib/prisma';
import { getMoySkladProducts } from '@/lib/moysklad-api';

// Интерфейсы и хелперы (без изменений)
interface MoySkladPrice {
  value: number;
  priceType: { name: string };
}
interface MoySkladProduct {
  id: string;
  name: string;
  description?: string;
  productFolder?: { meta: { href: string } };
  salePrices?: MoySkladPrice[];
}
function getUUIDFromHref(href: string): string {
  return href.split('/').pop() || '';
}
interface ParsedProductInfo {
  baseName: string;
  size: string | null;
}
function parseProductName(name: string): ParsedProductInfo {
  const sizeMatch = name.match(/\s+\((S|M|L|XS|XL|XXL)\)$/);
  if (sizeMatch) {
    const baseName = name.replace(sizeMatch[0], '').trim();
    const size = sizeMatch[1];
    return { baseName, size };
  }
  return { baseName: name.trim(), size: null };
}
interface GroupedProductVariant {
  moyskladId: string;
  size: string | null;
  description?: string;
  productFolder?: { meta: { href: string } };
  rawSalePrices?: MoySkladPrice[];
}

// --- ИЗМЕНЕНИЕ: Вся логика теперь в GET-обработчике ---
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cronSecret = searchParams.get('cron_secret');

  // 1. Проверяем секретный ключ
  // Мы сравниваем ключ из запроса с тем, что хранится в переменных окружения на Vercel
  if (process.env.CRON_SECRET !== cronSecret) {
    // Если ключи не совпадают - отказываем в доступе
    return new NextResponse(JSON.stringify({ error: 'Доступ запрещен' }), {
      status: 401,
    }); // 401 Unauthorized
  }

  // Если проверка пройдена, запускаем синхронизацию
  try {
    const moySkladResponse = await getMoySkladProducts();
    const moySkladProducts: MoySkladProduct[] = moySkladResponse.rows || [];

    if (moySkladProducts.length === 0) {
      // Важно возвращать JSON и успешный статус, даже если делать нечего
      return NextResponse.json({ message: 'Товары в МойСклад не найдены.' });
    }

    // --- ВСЯ НАША "УМНАЯ" ЛОГИКА ОСТАЕТСЯ ЗДЕСЬ ---
    const groupedProducts = new Map<string, GroupedProductVariant[]>();
    for (const product of moySkladProducts) {
      const { baseName, size } = parseProductName(product.name);
      if (!groupedProducts.has(baseName)) {
        groupedProducts.set(baseName, []);
      }
      groupedProducts.get(baseName)!.push({
        moyskladId: product.id,
        size,
        description: product.description,
        productFolder: product.productFolder,
        rawSalePrices: product.salePrices,
      });
    }

    const categoryMap = new Map<string, string>();
    const allOurCategories = await prisma.category.findMany({
      select: { id: true, moyskladId: true },
    });
    allOurCategories.forEach(
      (cat) => cat.moyskladId && categoryMap.set(cat.moyskladId, cat.id),
    );

    const transactionPromises = [];
    for (const [baseName, variants] of groupedProducts.entries()) {
      const firstVariant = variants[0];
      const categoryMoySkladId = firstVariant.productFolder
        ? getUUIDFromHref(firstVariant.productFolder.meta.href)
        : null;
      const ourCategoryId = categoryMoySkladId
        ? categoryMap.get(categoryMoySkladId)
        : undefined;

      let product = await prisma.product.findFirst({
        where: { name: baseName },
      });
      if (!product) {
        product = await prisma.product.create({
          data: {
            name: baseName,
            description: firstVariant.description || '',
            categories: ourCategoryId
              ? { connect: { id: ourCategoryId } }
              : undefined,
          },
        });
      }

      for (const variantData of variants) {
        const salePriceObj = (variantData.rawSalePrices || []).find(
          (p) => p.priceType.name === 'Скидка',
        );
        const regularPriceObj = (variantData.rawSalePrices || []).find(
          (p) => p.priceType.name === 'Цена продажи',
        );

        let currentPrice = 0;
        let oldPrice = null;

        const regularPriceValue = regularPriceObj
          ? Math.round(regularPriceObj.value)
          : 0;
        const salePriceValue = salePriceObj
          ? Math.round(salePriceObj.value)
          : 0;

        if (salePriceValue > 0 && salePriceValue < regularPriceValue) {
          currentPrice = salePriceValue;
          oldPrice = regularPriceValue;
        } else {
          currentPrice =
            regularPriceValue > 0 ? regularPriceValue : salePriceValue;
        }

        let sizeRecord = null;
        if (variantData.size) {
          sizeRecord = await prisma.size.upsert({
            where: { value: variantData.size },
            update: {},
            create: { value: variantData.size },
          });
        }

        const variantUpsert = prisma.variant.upsert({
          where: { moyskladId: variantData.moyskladId },
          update: { price: currentPrice, oldPrice: oldPrice },
          create: {
            price: currentPrice,
            oldPrice: oldPrice,
            product: { connect: { id: product.id } },
            moyskladId: variantData.moyskladId,
            inventory: sizeRecord
              ? { create: { sizeId: sizeRecord.id, stock: 0 } }
              : undefined,
          },
        });
        transactionPromises.push(variantUpsert);
      }
    }

    await prisma.$transaction(transactionPromises);

    // Успешный ответ для логов Vercel Cron
    return NextResponse.json({
      message: `Синхронизация по расписанию успешно завершена.`,
      synchronizedProducts: groupedProducts.size,
    });
  } catch (error) {
    console.error('[CRON SYNC ERROR]:', error);
    // Ответ с ошибкой для логов Vercel Cron
    return new NextResponse(
      JSON.stringify({
        error: 'Внутренняя ошибка сервера во время выполнения Cron Job.',
      }),
      { status: 500 },
    );
  }
}
