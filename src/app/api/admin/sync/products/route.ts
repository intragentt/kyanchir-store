// /src/app/api/admin/sync/products/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getMoySkladProducts, getMoySkladStock } from '@/lib/moysklad-api';

// --- ИНТЕРФЕЙСЫ И ХЕЛПЕРЫ ---
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
  const pathPart = href.split('/').pop() || '';
  const uuid = pathPart.split('?')[0];
  return uuid;
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
  stock: number;
}

async function runSync() {
  console.log('1/4: Получение товаров и остатков из МойСклад...');
  const [moySkladResponse, stockResponse] = await Promise.all([
    getMoySkladProducts(),
    getMoySkladStock(),
  ]);

  const moySkladProducts: MoySkladProduct[] = moySkladResponse.rows || [];
  const stockData: any[] = stockResponse.rows || [];

  if (moySkladProducts.length === 0) {
    return {
      message: 'Товары в МойСклад не найдены.',
      synchronizedProducts: 0,
    };
  }

  const stockMap = new Map<string, number>();
  stockData.forEach((item) => {
    const assortmentId = getUUIDFromHref(item.meta.href);
    if (assortmentId && typeof item.stock === 'number') {
      const currentStock = stockMap.get(assortmentId) || 0;
      stockMap.set(assortmentId, currentStock + item.stock);
    }
  });

  console.log(
    `2/4: Данные получены. Товаров: ${moySkladProducts.length}, Остатков: ${stockData.length} (уникальных: ${stockMap.size}).`,
  );

  const groupedProducts = new Map<string, GroupedProductVariant[]>();
  for (const product of moySkladProducts) {
    const stockValue = stockMap.get(product.id) || 0;
    const { baseName, size } = parseProductName(product.name);
    if (!groupedProducts.has(baseName)) groupedProducts.set(baseName, []);
    groupedProducts.get(baseName)!.push({
      moyskladId: product.id,
      size,
      description: product.description,
      productFolder: product.productFolder,
      rawSalePrices: product.salePrices,
      stock: stockValue,
    });
  }

  console.log(
    `3/4: Товары сгруппированы. Уникальных продуктов: ${groupedProducts.size}. Начинаем запись в БД...`,
  );

  const categoryMap = new Map<string, string>();
  const allOurCategories = await prisma.category.findMany({
    select: { id: true, moyskladId: true },
  });
  allOurCategories.forEach(
    (cat) => cat.moyskladId && categoryMap.set(cat.moyskladId, cat.id),
  );

  for (const [baseName, variants] of groupedProducts.entries()) {
    const firstVariant = variants[0];
    const categoryMoySkladId = firstVariant.productFolder
      ? getUUIDFromHref(firstVariant.productFolder.meta.href)
      : null;
    const ourCategoryId = categoryMoySkladId
      ? categoryMap.get(categoryMoySkladId)
      : undefined;

    let product = await prisma.product.findFirst({ where: { name: baseName } });
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
      // --- НАЧАЛО ИЗМЕНЕНИЙ: ЛОГИКА ОБРАБОТКИ СКИДОК ---

      let currentPrice = 0;
      let oldPrice: number | null = null;

      // 1. Ищем в массиве цен объект с типом "Скидка"
      const salePriceObj = (variantData.rawSalePrices || []).find(
        (p) => p.priceType.name === 'Скидка',
      );

      // 2. Ищем в массиве цен объект с типом "Цена продажи"
      const regularPriceObj = (variantData.rawSalePrices || []).find(
        (p) => p.priceType.name === 'Цена продажи',
      );

      // 3. Получаем числовые значения, если они есть.
      const regularPriceValue = regularPriceObj
        ? Math.round(regularPriceObj.value)
        : 0;
      const salePriceValue = salePriceObj ? Math.round(salePriceObj.value) : 0;

      // 4. Применяем бизнес-логику
      // Если цена со скидкой существует, больше 0 и меньше обычной цены...
      if (salePriceValue > 0 && salePriceValue < regularPriceValue) {
        // ...то товар акционный.
        currentPrice = salePriceValue; // Текущая цена = цена со скидкой
        oldPrice = regularPriceValue; // Старая цена = обычная цена
      } else {
        // ...иначе товар продается по обычной цене.
        currentPrice =
          regularPriceValue > 0 ? regularPriceValue : salePriceValue;
        oldPrice = null; // Старой цены нет
      }

      // --- КОНЕЦ ИЗМЕНЕНИЙ ---

      const variant = await prisma.variant.upsert({
        where: { moyskladId: variantData.moyskladId },
        update: {
          price: currentPrice,
          oldPrice: oldPrice,
          productId: product.id,
        },
        create: {
          price: currentPrice,
          oldPrice: oldPrice,
          product: { connect: { id: product.id } },
          moyskladId: variantData.moyskladId,
        },
      });

      const sizeValue = variantData.size || 'ONE_SIZE';
      const sizeRecord = await prisma.size.upsert({
        where: { value: sizeValue },
        update: {},
        create: { value: sizeValue },
      });

      await prisma.inventory.upsert({
        where: {
          variantId_sizeId: { variantId: variant.id, sizeId: sizeRecord.id },
        },
        update: { stock: variantData.stock },
        create: {
          variantId: variant.id,
          sizeId: sizeRecord.id,
          stock: variantData.stock,
        },
      });
    }
  }

  console.log('4/4: Синхронизация завершена успешно.');
  return {
    message: `Синхронизация успешно завершена.`,
    synchronizedProducts: groupedProducts.size,
  };
}

// === GET (Cron Job) и POST (кнопка) обработчики (без изменений) ===
export async function GET(req: NextRequest) {
  try {
    const cronSecret = req.nextUrl.searchParams.get('cron_secret');
    if (process.env.CRON_SECRET !== cronSecret) {
      return new NextResponse(JSON.stringify({ error: 'Доступ запрещен' }), {
        status: 401,
      });
    }
    console.log('[CRON SYNC] Запуск синхронизации продуктов по расписанию...');
    const result = await runSync();
    console.log(
      `[CRON SYNC] Синхронизация завершена. Обработано: ${result.synchronizedProducts} шт.`,
    );
    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[CRON SYNC ERROR]:', errorMessage);
    return new NextResponse(
      JSON.stringify({ error: 'Внутренняя ошибка сервера.' }),
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return new NextResponse(JSON.stringify({ error: 'Доступ запрещен' }), {
        status: 403,
      });
    }
    const userEmail = session.user.email || 'unknown';
    console.log(
      `[MANUAL SYNC] Запуск ручной синхронизации от пользователя ${userEmail}...`,
    );
    const result = await runSync();
    console.log(
      `[MANUAL SYNC] Синхронизация успешно завершена. Обработано: ${result.synchronizedProducts} шт.`,
    );
    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[MANUAL SYNC ERROR]:', errorMessage);
    return new NextResponse(
      JSON.stringify({ error: 'Внутренняя ошибка сервера.' }),
      { status: 500 },
    );
  }
}
