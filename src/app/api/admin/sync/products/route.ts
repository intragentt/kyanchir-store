// /src/app/api/admin/sync/products/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getMoySkladProducts } from '@/lib/moysklad-api';

// Интерфейсы и хелперы
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
  // Теперь передаем все цены для анализа
  rawSalePrices?: MoySkladPrice[];
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return new NextResponse(JSON.stringify({ error: 'Доступ запрещен' }), {
      status: 403,
    });
  }

  try {
    const moySkladResponse = await getMoySkladProducts();
    const moySkladProducts: MoySkladProduct[] = moySkladResponse.rows || [];

    if (moySkladProducts.length === 0) {
      return NextResponse.json({ message: 'Товары в МойСклад не найдены.' });
    }

    // 1. Группируем товары
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

    // 2. Запускаем "умный" upsert с логикой скидок
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
        // --- НОВАЯ ЛОГИКА СКИДОК ---
        const salePriceObj = (variantData.rawSalePrices || []).find(
          (p) => p.priceType.name === 'Цена продажи',
        );
        // !!! ПРЕДПОЛОЖЕНИЕ: Название обычной цены - "Розничная цена". Если оно другое, поменяй здесь!
        const regularPriceObj = (variantData.rawSalePrices || []).find(
          (p) => p.priceType.name === 'Розничная цена',
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
          // Это скидка!
          currentPrice = salePriceValue;
          oldPrice = regularPriceValue;
        } else {
          // Скидки нет, основная цена - обычная.
          currentPrice =
            regularPriceValue > 0 ? regularPriceValue : salePriceValue;
        }
        // --- КОНЕЦ НОВОЙ ЛОГИКИ СКИДОК ---

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
          update: {
            price: currentPrice,
            oldPrice: oldPrice,
          },
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

    return NextResponse.json({
      message: `Синхронизация успешно завершена. Сгруппировано в ${groupedProducts.size} уникальных товаров.`,
      synchronizedProducts: groupedProducts.size,
    });
  } catch (error) {
    console.error('[API SYNC PRODUCTS ERROR]:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Внутренняя ошибка сервера.' }),
      { status: 500 },
    );
  }
}
