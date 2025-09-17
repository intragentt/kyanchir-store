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
    console.log(
      '[SYNC PRODUCTS] Начало полной синхронизации товаров (Гранд-Редизайн)...',
    );

    console.log('[SYNC PRODUCTS] Шаг 1/3: Получение данных...');
    const [
      allMoySkladProducts, // Получаем все как есть
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

    if (!draftStatus) throw new Error('Статус "DRAFT" не найден.');

    console.log('[SYNC PRODUCTS] Шаг 2/3: Подготовка кэшей и группировка...');
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

    // --- НАЧАЛО ГРАНДИОЗНОГО РЕДИЗАЙНА: СОРТИРОВКА ПО БАЗОВОМУ ИМЕНИ ---
    const productGroups = new Map<string, any[]>();

    for (const msProduct of allMoySkladProducts) {
      if (msProduct.archived) continue;

      const nameMatch = msProduct.name.match(/(.+)\s\((.+)\)/);
      const baseName = nameMatch ? nameMatch[1].trim() : msProduct.name;

      if (!productGroups.has(baseName)) {
        productGroups.set(baseName, []);
      }
      productGroups.get(baseName)!.push(msProduct);
    }
    // --- КОНЕЦ СОРТИРОВКИ ---

    console.log(
      `[SYNC PRODUCTS] Шаг 3/3: Обработка ${productGroups.size} сгруппированных товаров...`,
    );

    await prisma.$transaction(async (tx) => {
      // Проходимся по "папкам" ("Пижама", "Комплект двойка" и т.д.)
      for (const [baseName, msProductsInGroup] of productGroups.entries()) {
        // Создаем ОДИН родительский товар-контейнер (Уровень 1)
        const parentProduct = await tx.product.upsert({
          where: { name: baseName },
          update: { name: baseName },
          create: {
            name: baseName,
            statusId: draftStatus.id,
            // Артикул и категорию берем от первого товара в группе
            article:
              msProductsInGroup[0].article || `TEMP-${msProductsInGroup[0].id}`,
            moyskladId: null, // Родительский товар - виртуальный
            categories: msProductsInGroup[0].productFolder
              ? {
                  connect: {
                    id: categoryMap.get(
                      getUUIDFromHref(
                        msProductsInGroup[0].productFolder.meta.href,
                      ),
                    ),
                  },
                }
              : undefined,
          },
        });

        // Проходимся по реальным товарам из МС внутри группы ("Пижама (Белый)", "Пижама (Розовый)")
        for (const msProduct of msProductsInGroup) {
          const nameMatch = msProduct.name.match(/(.+)\s\((.+)\)/);
          const colorName = nameMatch ? nameMatch[2].trim() : 'Основной';

          // Создаем для каждого из них ВАРИАНТ (Уровень 2)
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
              moySkladId: msProduct.id, // Связываем вариант с конкретным товаром в МС
            },
            create: {
              productId: parentProduct.id,
              color: colorName,
              price: (msProduct.salePrices?.[0]?.value || 0) / 100,
              oldPrice: (msProduct.salePrices?.[1]?.value || 0) / 100,
              moySkladId: msProduct.id,
            },
          });

          // Проверяем, есть ли у этого товара-варианта модификации (размеры)
          if (msProduct.variants && msProduct.variants.length > 0) {
            // Если да - создаем РАЗМЕРЫ (Уровень 3) из модификаций
            for (const msVariant of msProduct.variants) {
              const sizeCharacteristic = (msVariant.characteristics || []).find(
                (c: any) => c.name === 'Размер одежды',
              );
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
                where: {
                  productVariantId_sizeId: {
                    productVariantId: productVariant.id,
                    sizeId,
                  },
                },
                update: {
                  stock: stockMap.get(msVariant.id) || 0,
                  article: msVariant.article,
                  moyskladId: msVariant.id,
                  moySkladHref: msVariant.meta.href,
                },
                create: {
                  productVariantId: productVariant.id,
                  sizeId,
                  stock: stockMap.get(msVariant.id) || 0,
                  article: msVariant.article,
                  moyskladId: msVariant.id,
                  moySkladHref: msVariant.meta.href,
                  moySkladType: 'variant',
                },
              });
            }
          } else {
            // Если нет - сам товар-вариант является РАЗМЕРОМ "ONE SIZE" (Уровень 3)
            const sizeValue = 'ONE SIZE';
            let sizeId = sizeMap.get(sizeValue);
            if (!sizeId) {
              const newSize = await tx.size.create({
                data: { value: sizeValue },
              });
              sizeId = newSize.id;
              sizeMap.set(sizeValue, sizeId);
            }

            await tx.productSize.upsert({
              where: {
                productVariantId_sizeId: {
                  productVariantId: productVariant.id,
                  sizeId,
                },
              },
              update: {
                stock: stockMap.get(msProduct.id) || 0,
                article: msProduct.article,
                moyskladId: msProduct.id, // Источник данных - сам товар
                moySkladHref: msProduct.meta.href,
              },
              create: {
                productVariantId: productVariant.id,
                sizeId,
                stock: stockMap.get(msProduct.id) || 0,
                article: msProduct.article,
                moyskladId: msProduct.id,
                moySkladHref: msProduct.meta.href,
                moySkladType: 'product', // Тип - товар, а не модификация
              },
            });
          }
        }
      }
    });

    console.log('[SYNC PRODUCTS] Синхронизация успешно завершена.');
    return NextResponse.json({ message: 'Синхронизация успешно завершена.' });
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
