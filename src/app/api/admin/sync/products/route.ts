// /src/app/api/admin/sync/products/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  getProductsWithVariants,
  getMoySkladStock,
  AuthError,
} from '@/lib/moysklad-api';

function getUUIDFromHref(href: string): string {
  const parts = href.split('/');
  return parts[parts.length - 1];
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role?.name !== 'ADMIN') {
    return new NextResponse(JSON.stringify({ error: 'Доступ запрещен' }), {
      status: 403,
    });
  }

  try {
    console.log('[SYNC PRODUCTS] Начало полной синхронизации товаров...');

    console.log(
      '[SYNC PRODUCTS] Шаг 1/3: Получение данных из МойСклад и нашей БД...',
    );
    const [
      productsWithVariants,
      stockResponse,
      allOurCategories,
      allOurSizes,
      draftStatus,
    ] = await Promise.all([
      getProductsWithVariants(),
      getMoySkladStock(),
      prisma.category.findMany({ select: { id: true, moyskladId: true } }),
      prisma.size.findMany(),
      prisma.status.findFirst({ where: { name: 'DRAFT' } }),
    ]);

    if (!draftStatus) {
      throw new Error('Базовый статус "DRAFT" не найден в базе данных.');
    }

    console.log('[SYNC PRODUCTS] Шаг 2/3: Подготовка кэшей и карт...');
    const categoryMap = new Map(
      allOurCategories.map((cat) => [cat.moyskladId, cat.id]),
    );
    const stockMap = new Map<string, number>(
      stockResponse.rows.map((item: any) => [
        getUUIDFromHref(item.meta.href),
        item.stock || 0,
      ]),
    );
    const sizeMap = new Map(allOurSizes.map((s) => [s.value, s.id]));

    console.log(
      `[SYNC PRODUCTS] Шаг 3/3: Обработка ${productsWithVariants.length} родительских товаров...`,
    );

    await prisma.$transaction(async (tx) => {
      for (const msProduct of productsWithVariants) {
        const categoryMoySkladId = msProduct.productFolder
          ? getUUIDFromHref(msProduct.productFolder.meta.href)
          : null;
        const ourCategoryId = categoryMoySkladId
          ? categoryMap.get(categoryMoySkladId)
          : undefined;

        const parentProduct = await tx.product.upsert({
          where: { moyskladId: msProduct.id },
          update: {
            name: msProduct.name,
            article: msProduct.article,
            archived: msProduct.archived,
            categories: ourCategoryId
              ? { set: [{ id: ourCategoryId }] }
              : { set: [] },
          },
          create: {
            name: msProduct.name,
            article: msProduct.article || `TEMP-${msProduct.id}`,
            moyskladId: msProduct.id,
            statusId: draftStatus.id,
            archived: msProduct.archived,
            categories: ourCategoryId
              ? { connect: { id: ourCategoryId } }
              : undefined,
          },
        });

        if (msProduct.variants && msProduct.variants.length > 0) {
          const colorsMap = new Map<string, any[]>();

          for (const msVariant of msProduct.variants) {
            if (msVariant.archived) continue;

            // --- НАЧАЛО ИСПРАВЛЕНИЯ ЛОГИКИ ЦВЕТА ---
            const colorCharacteristics = (msVariant.characteristics || [])
              .filter((c: any) => c.name.toLowerCase().startsWith('цвет'))
              .sort((a: any, b: any) => a.name.localeCompare(b.name)); // Сортируем, чтобы "Цвет-1" был раньше "Цвет-2"

            const colorName =
              colorCharacteristics.length > 0
                ? colorCharacteristics.map((c: any) => c.value).join(' / ')
                : 'Основной';
            // --- КОНЕЦ ИСПРАВЛЕНИЯ ЛОГИКИ ЦВЕТА ---

            if (!colorsMap.has(colorName)) {
              colorsMap.set(colorName, []);
            }
            colorsMap.get(colorName)!.push(msVariant);
          }

          for (const [colorName, variantsInColor] of colorsMap.entries()) {
            const productVariant = await tx.productVariant.upsert({
              where: {
                productId_color: {
                  productId: parentProduct.id,
                  color: colorName,
                },
              },
              update: {
                price: (msProduct.salePrices?.[0]?.value || 0) / 100,
                oldPrice: (msProduct.salePrices?.[1]?.value || 0) / 100,
              },
              create: {
                productId: parentProduct.id,
                color: colorName,
                price: (msProduct.salePrices?.[0]?.value || 0) / 100,
                oldPrice: (msProduct.salePrices?.[1]?.value || 0) / 100,
              },
            });

            for (const msVariant of variantsInColor) {
              // --- НАЧАЛО ИСПРАВЛЕНИЯ ЛОГИКИ РАЗМЕРА ---
              const sizeCharacteristic = (msVariant.characteristics || []).find(
                (c: any) => c.name === 'Размер одежды', // Ищем правильное название
              );
              // --- КОНЕЦ ИСПРАВЛЕНИЯ ЛОГИКИ РАЗМЕРА ---
              if (!sizeCharacteristic) continue;

              const sizeValue = sizeCharacteristic.value;
              let sizeId = sizeMap.get(sizeValue);
              if (!sizeId) {
                const newSize = await tx.size.create({
                  data: { value: sizeValue },
                });
                sizeId = newSize.id;
                sizeMap.set(sizeValue, sizeId);
              }

              await tx.productSize.upsert({
                where: { moyskladId: msVariant.id },
                update: {
                  stock: stockMap.get(msVariant.id) || 0,
                  article: msVariant.article,
                  archived: msVariant.archived,
                },
                create: {
                  productVariantId: productVariant.id,
                  sizeId: sizeId,
                  moyskladId: msVariant.id,
                  moySkladHref: msVariant.meta.href,
                  moySkladType: msVariant.meta.type,
                  stock: stockMap.get(msVariant.id) || 0,
                  article: msVariant.article,
                  archived: msVariant.archived,
                },
              });
            }
          }
        }
      }
    });

    console.log('[SYNC PRODUCTS] Синхронизация успешно завершена.');
    return NextResponse.json({
      message: 'Синхронизация товаров успешно завершена.',
      totalProducts: productsWithVariants.length,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return new NextResponse(JSON.stringify({ error: error.message }), {
        status: 401,
      });
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[PRODUCTS SYNC ERROR]:', errorMessage, error);
    return new NextResponse(
      JSON.stringify({ error: `Ошибка синхронизации: ${errorMessage}` }),
      { status: 500 },
    );
  }
}
