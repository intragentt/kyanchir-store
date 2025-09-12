// /src/app/api/admin/sync/products/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getMoySkladProducts, getMoySkladStock } from '@/lib/moysklad-api';
import type { Status } from '@prisma/client';

function getUUIDFromHref(href: string): string {
  const pathPart = href.split('/').pop() || '';
  return pathPart.split('?')[0];
}

// Умный парсер, основанный на твоей логике
function parseProductName(name: string): {
  parentName: string;
  variantName: string;
  sizeName: string;
} {
  const sizeMatch = name.match(/, (S|M|L|XL|XS|XXL|ONE SIZE)\)$/i);
  const sizeName = sizeMatch
    ? sizeMatch[1].toUpperCase().replace(' ', '_')
    : 'ONE_SIZE';
  let nameWithoutSize = sizeMatch
    ? name.substring(0, sizeMatch.index).trim()
    : name;

  const colorMatch = nameWithoutSize.match(/\(([^)]+)\)$/);
  const variantName = colorMatch ? colorMatch[1] : 'Основной';
  const parentName = colorMatch
    ? nameWithoutSize.replace(colorMatch[0], '').trim()
    : nameWithoutSize;

  return { parentName, variantName, sizeName };
}

async function runSync() {
  console.log('--- ЗАПУСК ФИНАЛЬНОЙ ПЕРЕСБОРКИ СИНХРОНИЗАЦИИ v11 ---');

  // 1. ПОДГОТОВКА
  console.log('1/4: Получение данных...');
  const [moySkladResponse, stockResponse, statuses, allOurCategories] =
    await Promise.all([
      getMoySkladProducts(),
      getMoySkladStock(),
      prisma.status.findMany(),
      prisma.category.findMany({ select: { id: true, moyskladId: true } }),
    ]);

  const draftStatus = statuses.find((s: Status) => s.name === 'DRAFT');
  if (!draftStatus) throw new Error('Статус "DRAFT" не найден.');

  const categoryMap = new Map(
    allOurCategories.map((cat) => [cat.moyskladId, cat.id]),
  );
  const stockMap = new Map<string, number>();
  stockResponse.rows.forEach((item: any) => {
    const assortmentId = getUUIDFromHref(item.meta.href);
    const currentStock = stockMap.get(assortmentId) || 0;
    stockMap.set(assortmentId, currentStock + (item.stock || 0));
  });

  // 2. ГРУППИРОВКА В ПАМЯТИ
  console.log('2/4: Группировка товаров по родителям, вариантам и размерам...');
  const productGroups = new Map<string, Map<string, any[]>>();
  for (const item of moySkladResponse.rows) {
    const { parentName, variantName } = parseProductName(item.name);
    if (!productGroups.has(parentName)) {
      productGroups.set(parentName, new Map<string, any[]>());
    }
    const variantsMap = productGroups.get(parentName)!;
    if (!variantsMap.has(variantName)) {
      variantsMap.set(variantName, []);
    }
    variantsMap.get(variantName)!.push(item);
  }

  // 3. СИНХРОНИЗАЦИЯ С БД
  console.log('3/4: Синхронизация с БД...');
  for (const [parentName, variantsMap] of productGroups.entries()) {
    const firstVariantItems = Array.from(variantsMap.values())[0];
    const representativeItem = firstVariantItems[0];
    const categoryMoySkladId = representativeItem.productFolder
      ? getUUIDFromHref(representativeItem.productFolder.meta.href)
      : null;
    const ourCategoryId = categoryMoySkladId
      ? categoryMap.get(categoryMoySkladId)
      : undefined;

    const product = await prisma.product.upsert({
      where: { name: parentName },
      update: {},
      create: {
        name: parentName,
        article:
          representativeItem.article?.split('-')[0] || `prod-${Date.now()}`,
        statusId: draftStatus.id,
        categories: ourCategoryId
          ? { connect: { id: ourCategoryId } }
          : undefined,
      },
    });

    for (const [variantName, sizeItems] of variantsMap.entries()) {
      const repSizeItem = sizeItems[0];
      const regularPriceObj = (repSizeItem.salePrices || []).find(
        (p: any) => p.priceType.name === 'Цена продажи',
      );
      const salePriceObj = (repSizeItem.salePrices || []).find(
        (p: any) => p.priceType.name === 'Скидка',
      );
      const regularPrice = regularPriceObj
        ? Math.round(regularPriceObj.value)
        : 0;
      const salePrice = salePriceObj ? Math.round(salePriceObj.value) : 0;
      const price =
        salePrice > 0 && salePrice < regularPrice ? salePrice : regularPrice;
      const oldPrice =
        salePrice > 0 && salePrice < regularPrice ? regularPrice : null;

      const productVariant = await prisma.productVariant.upsert({
        where: {
          productId_color: { productId: product.id, color: variantName },
        },
        update: { price, oldPrice },
        create: {
          product: { connect: { id: product.id } },
          color: variantName,
          price,
          oldPrice,
        },
      });

      for (const item of sizeItems) {
        const { sizeName } = parseProductName(item.name);
        const size = await prisma.size.upsert({
          where: { value: sizeName },
          update: {},
          create: { value: sizeName },
        });

        await prisma.productSize.upsert({
          where: { moySkladHref: item.meta.href },
          update: {
            stock: stockMap.get(item.id) || 0,
          },
          create: {
            productVariant: { connect: { id: productVariant.id } },
            size: { connect: { id: size.id } },
            stock: stockMap.get(item.id) || 0,
            moySkladHref: item.meta.href,
            moySkladType: item.meta.type,
          },
        });
      }
    }
  }

  console.log('4/4: Синхронизация завершена успешно.');
  return { message: `Синхронизация успешно завершена.` };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session?.user || session.user.role?.name !== 'ADMIN') {
      return new NextResponse(JSON.stringify({ error: 'Доступ запрещен' }), {
        status: 403,
      });
    }
    const result = await runSync();
    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[MANUAL SYNC ERROR]:', errorMessage);
    return new NextResponse(
      JSON.stringify({ error: `Внутренняя ошибка сервера: ${errorMessage}` }),
      { status: 500 },
    );
  }
}
