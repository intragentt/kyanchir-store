// /src/app/api/admin/utils/backfill-skus/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  getMoySkladProductsAndVariants,
  updateMoySkladArticle,
  getMoySkladEntityByHref,
} from '@/lib/moysklad-api';
import {
  generateProductSku,
  generateVariantSku,
  generateSizeSku,
} from '@/lib/sku-generator';

function getUUIDFromHref(href: string): string {
  return href.split('/').pop() || '';
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role?.name !== 'ADMIN') {
    return new NextResponse(JSON.stringify({ error: 'Доступ запрещен' }), {
      status: 403,
    });
  }

  try {
    console.log('[BACKFILL] Запуск операции "Артикул" v2...');

    const [moySkladResponse, allOurCategories] = await Promise.all([
      getMoySkladProductsAndVariants(),
      prisma.category.findMany(),
    ]);

    const moySkladItems: any[] = moySkladResponse.rows || [];
    const categoryMap = new Map(
      allOurCategories.map((cat) => [cat.moyskladId, cat]),
    );

    const productsToFix = moySkladItems.filter(
      (item) => !item.article || item.article.trim() === '',
    );

    if (productsToFix.length === 0) {
      return NextResponse.json({
        message: 'Отлично! Все товары в МойСклад уже имеют артикулы.',
      });
    }

    console.log(
      `[BACKFILL] Найдено ${productsToFix.length} товаров без артикула.`,
    );
    let updatedCount = 0;
    const errors: string[] = [];

    const parentProductCache = new Map<string, any>();

    for (const msProduct of productsToFix) {
      try {
        let newArticle: string;

        if (msProduct.meta.type === 'variant') {
          // ЭТО МОДИФИКАЦИЯ
          const parentHref = msProduct.product.meta.href;
          let parentProduct = parentProductCache.get(parentHref);
          if (!parentProduct) {
            parentProduct = await getMoySkladEntityByHref(parentHref);
            parentProductCache.set(parentHref, parentProduct);
          }

          if (!parentProduct.article) {
            throw new Error(
              `Родительский товар ${parentProduct.name} сам не имеет артикула. Исправьте его первым.`,
            );
          }

          const baseVariantArticle = generateVariantSku(
            parentProduct.article,
            0,
          );
          const sizeChar =
            msProduct.characteristics?.find((c: any) => c.name === 'Размер')
              ?.value || 'ONE_SIZE';

          newArticle = generateSizeSku(baseVariantArticle, sizeChar);
        } else {
          // ЭТО ОБЫЧНЫЙ ТОВАР
          const categoryMoySkladId = msProduct.productFolder
            ? getUUIDFromHref(msProduct.productFolder.meta.href)
            : null;
          if (!categoryMoySkladId) throw new Error('Не имеет категории');

          const ourCategory = categoryMap.get(categoryMoySkladId);
          if (!ourCategory) throw new Error(`Категория не найдена в нашей БД`);

          newArticle = await generateProductSku(prisma, ourCategory.id);
        }

        // Передаем ID, новый артикул и ТИП ('product' или 'variant')
        await updateMoySkladArticle(
          msProduct.id,
          newArticle,
          msProduct.meta.type,
        );

        updatedCount++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          `[BACKFILL] Ошибка при обработке товара ${msProduct.name} (${msProduct.id}): ${errorMessage}`,
        );
        errors.push(`${msProduct.name}: ${errorMessage}`);
      }
    }

    console.log('[BACKFILL] Операция "Артикул" завершена.');
    return NextResponse.json({
      message: 'Операция завершена.',
      totalFound: productsToFix.length,
      successfullyUpdated: updatedCount,
      errors: errors,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[BACKFILL ERROR]:', errorMessage);
    return new NextResponse(
      JSON.stringify({ error: `Критическая ошибка: ${errorMessage}` }),
      { status: 500 },
    );
  }
}
