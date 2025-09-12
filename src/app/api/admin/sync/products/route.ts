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

// Утилита для парсинга имен, как ты и предлагал
function parseProductName(name: string): {
  parentName: string;
  variantName: string;
  sizeName: string;
} {
  // Пример: "Комплект двойка (Белый, S)" -> { parentName: 'Комплект двойка', variantName: 'Белый', sizeName: 'S' }
  const sizeMatch = name.match(/, (S|M|L|XL|XS|XXL|ONE SIZE)\)$/i);
  const sizeName = sizeMatch
    ? sizeMatch[1].toUpperCase().replace(' ', '_')
    : 'ONE_SIZE';
  const nameWithoutSize = sizeMatch
    ? name.replace(sizeMatch[0] + ')', '').trim()
    : name;

  const colorMatch = nameWithoutSize.match(/\(([^)]+)\)$/);
  const variantName = colorMatch ? colorMatch[1] : 'Основной';
  const parentName = colorMatch
    ? nameWithoutSize.replace(colorMatch[0], '').trim()
    : nameWithoutSize;

  return { parentName, variantName, sizeName };
}

async function runSync() {
  console.log('--- ЗАПУСК СИНХРОНИЗАЦИИ ПО АРТИКУЛАМ v1 ---');

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

  const moySkladItems: any[] = moySkladResponse.rows || [];

  // 2. ГРУППИРОВКА В ПАМЯТИ
  console.log('2/4: Группировка товаров по родителям...');
  const productGroups = new Map<string, any[]>();
  for (const item of moySkladItems) {
    const { parentName } = parseProductName(item.name);
    if (!productGroups.has(parentName)) {
      productGroups.set(parentName, []);
    }
    productGroups.get(parentName)!.push(item);
  }

  // 3. СИНХРОНИЗАЦИЯ
  console.log('3/4: Синхронизация данных с БД...');
  for (const [parentName, msItems] of productGroups.entries()) {
    const representativeItem = msItems[0];
    const categoryMoySkladId = representativeItem.productFolder
      ? getUUIDFromHref(representativeItem.productFolder.meta.href)
      : null;
    const ourCategoryId = categoryMoySkladId
      ? categoryMap.get(categoryMoySkladId)
      : undefined;

    // Создаем родительский Product
    const product = await prisma.product.upsert({
      where: { name: parentName },
      update: {
        categories: ourCategoryId
          ? { set: [{ id: ourCategoryId }] }
          : undefined,
      },
      create: {
        name: parentName,
        article:
          representativeItem.article?.split('-')[0] || `prod-${Date.now()}`,
        statusId: draftStatus.id,
        moyskladId: representativeItem.product?.meta
          ? getUUIDFromHref(representativeItem.product.meta.href)
          : representativeItem.id,
        categories: ourCategoryId
          ? { connect: { id: ourCategoryId } }
          : undefined,
      },
    });

    // Группируем варианты по цветам
    const variantsMap = new Map<string, any[]>();
    for (const item of msItems) {
      const { variantName } = parseProductName(item.name);
      if (!variantsMap.has(variantName)) {
        variantsMap.set(variantName, []);
      }
      variantsMap.get(variantName)!.push(item);
    }

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
            productVariantId: productVariant.id,
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
