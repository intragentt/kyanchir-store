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
  console.log('--- ЗАПУСК НОВОЙ УМНОЙ СИНХРОНИЗАЦИИ ---');

  // 1. ПОДГОТОВКА: Получаем все данные
  console.log('1/4: Получение данных из МойСклад и нашей БД...');
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
    stockMap.set(getUUIDFromHref(item.meta.href), item.stock || 0);
  });

  const moySkladItems: any[] = moySkladResponse.rows || [];
  const parentProducts = moySkladItems.filter(
    (item) => item.meta.type === 'product',
  );
  const variants = moySkladItems.filter((item) => item.meta.type === 'variant');

  console.log(
    `Данные получены: Товаров=${parentProducts.length}, Модификаций=${variants.length}, Остатков=${stockMap.size}`,
  );

  // 2. ЭТАП 1: Синхронизация Родительских Товаров
  console.log('2/4: Синхронизация родительских товаров...');
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
        description: msProduct.description || '',
        article: msProduct.article || '',
        categories: ourCategoryId
          ? { set: [{ id: ourCategoryId }] }
          : undefined,
      },
      create: {
        name: msProduct.name,
        description: msProduct.description || '',
        article: msProduct.article || `ms-${msProduct.id}`,
        statusId: draftStatus.id,
        moyskladId: msProduct.id,
        categories: ourCategoryId
          ? { connect: { id: ourCategoryId } }
          : undefined,
      },
    });
  }

  // 3. ЭТАП 2: Синхронизация Вариантов (Модификаций)
  console.log('3/4: Синхронизация вариантов (модификаций)...');

  // Создаем карту для быстрого доступа к нашим родительским товарам по их ID из МойСклад
  const ourProductsMap = new Map(
    (
      await prisma.product.findMany({ select: { id: true, moyskladId: true } })
    ).map((p) => [p.moyskladId, p.id]),
  );

  for (const msVariant of variants) {
    const parentProductMoySkladId = getUUIDFromHref(
      msVariant.product.meta.href,
    );
    const ourProductId = ourProductsMap.get(parentProductMoySkladId);

    if (!ourProductId) {
      console.warn(
        `[SYNC] Пропущен вариант "${msVariant.name}", т.к. не найден родительский товар с moyskladId=${parentProductMoySkladId}`,
      );
      continue;
    }

    // Извлекаем характеристики (например, Цвет, Размер)
    const colorCharacteristic = msVariant.characteristics?.find(
      (c: any) => c.name === 'Цвет',
    );
    const sizeCharacteristic = msVariant.characteristics?.find(
      (c: any) => c.name === 'Размер',
    );

    const color = colorCharacteristic?.value || 'Основной';
    const sizeValue = sizeCharacteristic?.value || 'ONE_SIZE';

    // Получаем или создаем ID размера в нашей БД
    let ourSizeId = sizeMap.get(sizeValue);
    if (!ourSizeId) {
      const newSize = await prisma.size.create({ data: { value: sizeValue } });
      ourSizeId = newSize.id;
      sizeMap.set(sizeValue, ourSizeId);
    }

    // Определяем цены
    const regularPriceObj = (msVariant.salePrices || []).find(
      (p: any) => p.priceType.name === 'Цена продажи',
    );
    const salePriceObj = (msVariant.salePrices || []).find(
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

    // Создаем или обновляем ProductVariant
    const productVariant = await prisma.productVariant.upsert({
      where: { moySkladId: msVariant.id },
      update: { color, price, oldPrice },
      create: {
        product: { connect: { id: ourProductId } },
        color,
        price,
        oldPrice,
        moySkladId: msVariant.id,
      },
    });

    // Создаем или обновляем ProductSize
    await prisma.productSize.upsert({
      where: { moySkladHref: msVariant.meta.href },
      update: {
        stock: stockMap.get(msVariant.id) || 0,
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

  console.log('4/4: Умная синхронизация завершена успешно.');
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
      JSON.stringify({ error: 'Внутренняя ошибка сервера.' }),
      { status: 500 },
    );
  }
}
