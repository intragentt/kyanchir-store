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

async function runSync() {
  console.log('--- ЗАПУСК ФИНАЛЬНОЙ ПЕРЕСБОРКИ СИНХРОНИЗАЦИИ v12 ---');

  // 1. ПОДГОТОВКА
  console.log('1/5: Получение данных...');
  const [
    moySkladResponse,
    stockResponse,
    statuses,
    allOurCategories,
    allOurSizes,
  ] = await Promise.all([
    getMoySkladProducts(),
    getMoySkladStock(),
    prisma.status.findMany(),
    prisma.category.findMany({ select: { id: true, moyskladId: true } }),
    prisma.size.findMany(),
  ]);

  const draftStatus = statuses.find((s: Status) => s.name === 'DRAFT');
  if (!draftStatus) throw new Error('Статус "DRAFT" не найден.');

  const categoryMap = new Map(
    allOurCategories.map((cat) => [cat.moyskladId, cat.id]),
  );
  const sizeMap = new Map(allOurSizes.map((size) => [size.value, size.id]));
  const stockMap = new Map<string, number>();
  stockResponse.rows.forEach((item: any) => {
    const assortmentId = getUUIDFromHref(item.meta.href);
    const currentStock = stockMap.get(assortmentId) || 0;
    stockMap.set(assortmentId, currentStock + (item.stock || 0));
  });

  const moySkladItems: any[] = moySkladResponse.rows || [];
  const parentProducts = moySkladItems.filter(
    (item) => item.meta.type === 'product',
  );
  const variants = moySkladItems.filter((item) => item.meta.type === 'variant');

  // 2. СИНХРОНИЗАЦИЯ РОДИТЕЛЕЙ
  console.log('2/5: Синхронизация родительских товаров...');
  for (const msProduct of parentProducts) {
    const categoryMoySkladId = msProduct.productFolder
      ? getUUIDFromHref(msProduct.productFolder.meta.href)
      : null;
    const ourCategoryId = categoryMoySkladId
      ? categoryMap.get(categoryMoySkladId)
      : undefined;

    await prisma.product.upsert({
      where: { moyskladId: msProduct.id },
      update: { name: msProduct.name },
      create: {
        name: msProduct.name,
        article: msProduct.article || `ms-${msProduct.id}`,
        statusId: draftStatus.id,
        moyskladId: msProduct.id,
        categories: ourCategoryId
          ? { connect: { id: ourCategoryId } }
          : undefined,
      },
    });
  }

  // 3. ОБРАБОТКА ПРОСТЫХ ТОВАРОВ (БЕЗ ВАРИАНТОВ)
  console.log('3/5: Обработка простых товаров...');
  const ourProductsMap = new Map(
    (
      await prisma.product.findMany({ select: { id: true, moyskladId: true } })
    ).map((p) => [p.moyskladId, p.id]),
  );

  for (const msProduct of parentProducts) {
    if (msProduct.variantsCount === 0) {
      const ourProductId = ourProductsMap.get(msProduct.id);
      if (!ourProductId) continue;

      const oneSize = await prisma.size.upsert({
        where: { value: 'ONE_SIZE' },
        update: {},
        create: { value: 'ONE_SIZE' },
      });
      sizeMap.set('ONE_SIZE', oneSize.id);
      const priceObj = (msProduct.salePrices || []).find(
        (p: any) => p.priceType.name === 'Цена продажи',
      );
      const price = priceObj ? Math.round(priceObj.value) : 0;

      const variant = await prisma.productVariant.upsert({
        where: {
          productId_color: { productId: ourProductId, color: 'Основной' },
        },
        update: { price, moySkladId: msProduct.id },
        create: {
          product: { connect: { id: ourProductId } },
          color: 'Основной',
          price,
          moySkladId: msProduct.id,
        },
      });

      // --- ИСПРАВЛЕНИЕ 1: Используем правильный уникальный ключ ---
      await prisma.productSize.upsert({
        where: {
          productVariantId_sizeId: {
            productVariantId: variant.id,
            sizeId: oneSize.id,
          },
        },
        update: { stock: stockMap.get(msProduct.id) || 0 },
        create: {
          productVariant: { connect: { id: variant.id } },
          size: { connect: { id: oneSize.id } },
          stock: stockMap.get(msProduct.id) || 0,
          moySkladHref: msProduct.meta.href,
          moySkladType: msProduct.meta.type,
        },
      });
    }
  }

  // 4. ГРУППИРОВКА СЛОЖНЫХ ВАРИАНТОВ
  console.log('4/5: Группировка сложных вариантов...');
  const groupedVariants = new Map<string, Map<string, any[]>>();
  for (const msVariant of variants) {
    const parentProductMoySkladId = getUUIDFromHref(
      msVariant.product.meta.href,
    );
    const ourProductId = ourProductsMap.get(parentProductMoySkladId);
    if (!ourProductId) continue;
    const color =
      msVariant.characteristics?.find((c: any) => c.name === 'Цвет')?.value ||
      'Основной';
    if (!groupedVariants.has(ourProductId))
      groupedVariants.set(ourProductId, new Map<string, any[]>());
    const productColors = groupedVariants.get(ourProductId)!;
    if (!productColors.has(color)) productColors.set(color, []);
    productColors.get(color)!.push(msVariant);
  }

  // 5. СИНХРОНИЗАЦИЯ СЛОЖНЫХ ВАРИАНТОВ
  console.log('5/5: Синхронизация сгруппированных вариантов...');
  for (const [ourProductId, colorsMap] of groupedVariants.entries()) {
    for (const [color, msVariantsInColor] of colorsMap.entries()) {
      const representativeVariant = msVariantsInColor[0];
      const regularPriceObj = (representativeVariant.salePrices || []).find(
        (p: any) => p.priceType.name === 'Цена продажи',
      );
      const salePriceObj = (representativeVariant.salePrices || []).find(
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
        where: { productId_color: { productId: ourProductId, color: color } },
        update: { price, oldPrice },
        create: {
          product: { connect: { id: ourProductId } },
          color,
          price,
          oldPrice,
        },
      });

      for (const msVariant of msVariantsInColor) {
        const sizeValue =
          msVariant.characteristics?.find((c: any) => c.name === 'Размер')
            ?.value || 'ONE_SIZE';
        let ourSizeId = sizeMap.get(sizeValue);
        if (!ourSizeId) {
          const newSize = await prisma.size.create({
            data: { value: sizeValue },
          });
          ourSizeId = newSize.id;
          sizeMap.set(sizeValue, ourSizeId);
        }

        // --- ИСПРАВЛЕНИЕ 2: Используем правильный уникальный ключ ---
        await prisma.productSize.upsert({
          where: {
            productVariantId_sizeId: {
              productVariantId: productVariant.id,
              sizeId: ourSizeId,
            },
          },
          update: {
            stock: stockMap.get(msVariant.id) || 0,
            moySkladHref: msVariant.meta.href,
          },
          create: {
            productVariant: { connect: { id: productVariant.id } },
            size: { connect: { id: ourSizeId } },
            stock: stockMap.get(msVariant.id) || 0,
            moySkladHref: msVariant.meta.href,
            moySkladType: msVariant.meta.type,
          },
        });
      }
    }
  }

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
