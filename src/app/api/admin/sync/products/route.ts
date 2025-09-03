// /src/app/api/admin/sync/products/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
// --- НАЧАЛО ИЗМЕНЕНИЙ: ИСПРАВЛЯЕМ ИМПОРТ ---
import prisma from '@/lib/prisma';
import type { Status } from '@prisma/client'; // Импортируем Status напрямую как тип
// --- КОНЕЦ ИЗМЕНЕНИЙ ---
import { getMoySkladProducts, getMoySkladStock } from '@/lib/moysklad-api';

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
  return pathPart.split('?')[0];
}

interface ParsedProductInfo {
  productName: string;
  variantName: string;
  size: string | null;
}

function parseMoySkladName(name: string): ParsedProductInfo {
  const sizeMatch = name.match(/\s+\((S|M|L|XS|XL|XXL|ONE_SIZE)\)$/i);
  let nameWithoutSize = name.trim();
  const size = sizeMatch ? sizeMatch[1].toUpperCase() : null;
  if (sizeMatch) {
    nameWithoutSize = name.replace(sizeMatch[0], '').trim();
  }

  const colors = [
    'черный',
    'белый',
    'красный',
    'синий',
    'зеленый',
    'бежевый',
    'розовый',
    'голубой',
    'серый',
    'коричневый',
    'фиолетовый',
    'оранжевый',
  ];
  let productName = nameWithoutSize;
  let variantName = 'Основной';

  for (const color of colors) {
    const regex = new RegExp(`\\s+${color}$`, 'i');
    if (regex.test(nameWithoutSize)) {
      productName = nameWithoutSize.replace(regex, '').trim();
      variantName = color.charAt(0).toUpperCase() + color.slice(1);
      break;
    }
  }

  return { productName, variantName, size };
}

interface ProductSizeData {
  moyskladId: string;
  size: string | null;
  description?: string;
  productFolder?: { meta: { href: string } };
  rawSalePrices?: MoySkladPrice[];
  stock: number;
}

async function runSync() {
  console.log('1/5: Получение товаров и остатков из МойСклад...');
  const [moySkladResponse, stockResponse, statuses] = await Promise.all([
    getMoySkladProducts(),
    getMoySkladStock(),
    prisma.status.findMany(),
  ]);

  const defaultStatus = statuses.find((s: Status) => s.name === 'DRAFT');
  if (!defaultStatus) {
    throw new Error(
      'Статус "DRAFT" не найден в базе данных. Запустите seed-скрипт.',
    );
  }

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
    `2/5: Данные получены. Товаров: ${moySkladProducts.length}, Остатков: ${stockData.length}.`,
  );

  const groupedProducts = new Map<string, Map<string, ProductSizeData[]>>();
  for (const product of moySkladProducts) {
    const { productName, variantName, size } = parseMoySkladName(product.name);
    if (!groupedProducts.has(productName)) {
      groupedProducts.set(productName, new Map<string, ProductSizeData[]>());
    }
    const productVariants = groupedProducts.get(productName)!;
    if (!productVariants.has(variantName)) {
      productVariants.set(variantName, []);
    }
    const variantSizes = productVariants.get(variantName)!;
    variantSizes.push({
      moyskladId: product.id,
      size,
      description: product.description,
      productFolder: product.productFolder,
      rawSalePrices: product.salePrices,
      stock: stockMap.get(product.id) || 0,
    });
  }

  console.log(
    `3/5: Товары сгруппированы. Уникальных продуктов: ${groupedProducts.size}.`,
  );
  console.log('4/5: Начинаем запись в БД...');

  const categoryMap = new Map<string, string>();
  const allOurCategories = await prisma.category.findMany({
    select: { id: true, moyskladId: true },
  });
  allOurCategories.forEach(
    (cat: { id: string; moyskladId: string | null }) =>
      cat.moyskladId && categoryMap.set(cat.moyskladId, cat.id),
  );

  let totalProductsSynced = 0;

  for (const [productName, variantsMap] of groupedProducts.entries()) {
    const firstVariantData = Array.from(variantsMap.values())[0][0];
    const categoryMoySkladId = firstVariantData.productFolder
      ? getUUIDFromHref(firstVariantData.productFolder.meta.href)
      : null;
    const ourCategoryId = categoryMoySkladId
      ? categoryMap.get(categoryMoySkladId)
      : undefined;

    const product = await prisma.product.upsert({
      where: { name: productName },
      update: {
        description: firstVariantData.description || '',
        categories: ourCategoryId
          ? { set: [{ id: ourCategoryId }] }
          : undefined,
      },
      create: {
        name: productName,
        description: firstVariantData.description || '',
        statusId: defaultStatus.id,
        categories: ourCategoryId
          ? { connect: { id: ourCategoryId } }
          : undefined,
      },
    });

    for (const [variantName, sizesArray] of variantsMap.entries()) {
      const representativeSize = sizesArray[0];

      let currentPrice = 0;
      let oldPrice: number | null = null;
      const regularPriceObj = (representativeSize.rawSalePrices || []).find(
        (p) => p.priceType.name === 'Цена продажи',
      );
      const salePriceObj = (representativeSize.rawSalePrices || []).find(
        (p) => p.priceType.name === 'Скидка',
      );
      const regularPriceValue = regularPriceObj
        ? Math.round(regularPriceObj.value)
        : 0;
      const salePriceValue = salePriceObj ? Math.round(salePriceObj.value) : 0;

      if (salePriceValue > 0 && salePriceValue < regularPriceValue) {
        currentPrice = salePriceValue;
        oldPrice = regularPriceValue;
      } else {
        currentPrice =
          regularPriceValue > 0 ? regularPriceValue : salePriceValue;
        oldPrice = null;
      }

      const productVariant = await prisma.productVariant.upsert({
        where: {
          productId_color: { productId: product.id, color: variantName },
        },
        update: { price: currentPrice, oldPrice: oldPrice },
        create: {
          product: { connect: { id: product.id } },
          color: variantName,
          price: currentPrice,
          oldPrice: oldPrice,
        },
      });

      for (const sizeData of sizesArray) {
        const sizeValue = sizeData.size || 'ONE_SIZE';
        const sizeRecord = await prisma.size.upsert({
          where: { value: sizeValue },
          update: {},
          create: { value: sizeValue },
        });

        await prisma.productSize.upsert({
          where: { moyskladId: sizeData.moyskladId },
          update: {
            stock: sizeData.stock,
            productVariantId: productVariant.id,
            sizeId: sizeRecord.id,
          },
          create: {
            moyskladId: sizeData.moyskladId,
            stock: sizeData.stock,
            productVariant: { connect: { id: productVariant.id } },
            size: { connect: { id: sizeRecord.id } },
          },
        });
      }
    }
    totalProductsSynced++;
  }

  console.log('5/5: Синхронизация завершена успешно.');
  return {
    message: `Синхронизация успешно завершена.`,
    synchronizedProducts: totalProductsSynced,
  };
}

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
      `[CRON SYNC] Синхронизация завершена. Обработано: ${result.synchronizedProducts} продуктов.`,
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
    // @ts-ignore - Временно игнорируем ошибку типа для `role`, так как next-auth мог не обновить тип сессии
    if (!session?.user || session.user.role?.name !== 'ADMIN') {
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
      `[MANUAL SYNC] Синхронизация успешно завершена. Обработано: ${result.synchronizedProducts} продуктов.`,
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
