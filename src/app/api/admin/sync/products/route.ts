// /src/app/api/admin/sync/products/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import type { Status } from '@prisma/client';
import { getMoySkladProducts, getMoySkladStock } from '@/lib/moysklad-api';

interface MoySkladProduct {
  id: string;
  name: string;
  description?: string;
  productFolder?: { meta: { href: string } };
  salePrices?: { value: number; priceType: { name: string } }[];
  meta: { href: string; type: string };
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
  moySkladHref: string;
  moySkladType: string;
  size: string | null;
  description?: string;
  productFolder?: { meta: { href: string } };
  rawSalePrices?: { value: number; priceType: { name: string } }[];
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
    throw new Error('Статус "DRAFT" не найден.');
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
      stockMap.set(
        assortmentId,
        (stockMap.get(assortmentId) || 0) + item.stock,
      );
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
      moySkladHref: product.meta.href,
      moySkladType: product.meta.type,
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
    (cat) => cat.moyskladId && categoryMap.set(cat.moyskladId, cat.id),
  );
  let totalProductsSynced = 0;
  for (const [productName, variantsMap] of groupedProducts.entries()) {
    const firstVariantData = Array.from(variantsMap.values())[0][0];
    if (!firstVariantData) continue;
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
      // --- НАЧАЛО ИЗМЕНЕНИЙ: "Умная" фильтрация призрачных размеров ВНУТРИ варианта ---
      let finalSizesArray = sizesArray;
      const hasNullSize = sizesArray.some((item) => item.size === null);
      const hasRealSizes = sizesArray.some((item) => item.size !== null);
      if (hasNullSize && hasRealSizes) {
        finalSizesArray = sizesArray.filter((item) => item.size !== null);
        console.log(
          `[SYNC] Отфильтрован "призрачный" размер для варианта "${variantName}" товара "${productName}".`,
        );
      }
      if (finalSizesArray.length === 0) continue; // Если после фильтрации не осталось размеров, пропускаем вариант
      // --- КОНЕЦ ИЗМЕНЕНИЙ ---

      const representativeSize = finalSizesArray[0];
      const variantMoySkladId = getUUIDFromHref(
        representativeSize.moySkladHref,
      );
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
        update: {
          price: currentPrice,
          oldPrice: oldPrice,
          moySkladId: variantMoySkladId,
        },
        create: {
          product: { connect: { id: product.id } },
          color: variantName,
          price: currentPrice,
          oldPrice: oldPrice,
          moySkladId: variantMoySkladId,
        },
      });
      for (const sizeData of finalSizesArray) {
        // <--- Используем отфильтрованный массив
        const sizeValue = sizeData.size || 'ONE_SIZE';
        const sizeRecord = await prisma.size.upsert({
          where: { value: sizeValue },
          update: {},
          create: { value: sizeValue },
        });
        await prisma.productSize.upsert({
          where: { moySkladHref: sizeData.moySkladHref },
          update: {
            stock: sizeData.stock,
            productVariantId: productVariant.id,
            sizeId: sizeRecord.id,
            moySkladType: sizeData.moySkladType,
          },
          create: {
            moySkladHref: sizeData.moySkladHref,
            moySkladType: sizeData.moySkladType,
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
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
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
