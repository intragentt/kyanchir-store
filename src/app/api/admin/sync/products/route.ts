// /src/app/api/admin/sync/products/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getMoySkladProducts, getMoySkladStock } from '@/lib/moysklad-api';
import type { Status } from '@prisma/client';

function getUUIDFromHref(href: string): string {
  return href.split('/').pop() || '';
}

async function runSync() {
  console.log('--- ЗАПУСК ФИНАЛЬНОЙ УМНОЙ СИНХРОНИЗАЦИИ v8 (ГАРАНТИЯ) ---');

  // 1. ПОДГОТОВКА: Получаем все данные
  console.log('1/5: Получение данных из МойСклад и нашей БД...');
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

  // --- НАЧАЛО ФИНАЛЬНОГО ИСПРАВЛЕНИЯ: Используем href-ключ и суммируем ---
  const stockMap = new Map<string, number>();
  stockResponse.rows.forEach((item: any) => {
    // Используем UUID из meta.href, это единственный надежный ключ
    const assortmentId = getUUIDFromHref(item.meta.href);
    const currentStock = stockMap.get(assortmentId) || 0;
    stockMap.set(assortmentId, currentStock + (item.stock || 0));
  });
  // --- КОНЕЦ ФИНАЛЬНОГО ИСПРАВЛЕНИЯ ---

  const moySkladItems: any[] = moySkladResponse.rows || [];
  const parentProducts = moySkladItems.filter(
    (item) => item.meta.type === 'product',
  );
  const variants = moySkladItems.filter((item) => item.meta.type === 'variant');

  console.log(
    `Данные получены: Товаров=${parentProducts.length}, Модификаций=${variants.length}`,
  );

  // 2. ЭТАП 1: Синхронизация Родительских Товаров
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
      update: {
        name: msProduct.name,
      },
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

  // 3. ЭТАП 2: Предварительная группировка вариантов
  console.log('3/5: Группировка вариантов по цветам и размерам...');
  const ourProductsMap = new Map(
    (
      await prisma.product.findMany({ select: { id: true, moyskladId: true } })
    ).map((p) => [p.moyskladId, p.id]),
  );

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

    if (!groupedVariants.has(ourProductId)) {
      groupedVariants.set(ourProductId, new Map<string, any[]>());
    }
    const productColors = groupedVariants.get(ourProductId)!;

    if (!productColors.has(color)) {
      productColors.set(color, []);
    }
    productColors.get(color)!.push(msVariant);
  }

  // 4. ЭТАП 3: Синхронизация сгруппированных вариантов
  console.log('4/5: Синхронизация сгруппированных вариантов и размеров...');
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

        await prisma.productSize.upsert({
          where: { moySkladHref: msVariant.meta.href },
          update: {
            stock: stockMap.get(msVariant.id) || 0,
            productVariantId: productVariant.id,
            sizeId: ourSizeId,
            moySkladType: msVariant.meta.type,
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

  console.log('5/5: Умная синхронизация завершена успешно.');
  return {
    message: `Синхронизация успешно завершена.`,
    synchronizedProducts: parentProducts.length,
    synchronizedVariants: variants.length,
  };
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
