// /src/app/api/admin/utils/backfill-skus/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  getMoySkladProductsAndVariants,
  updateMoySkladArticle,
} from '@/lib/moysklad-api';
import { generateProductSku } from '@/lib/sku-generator';

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
    console.log('[BACKFILL] Запуск операции "Артикул"...');

    // 1. Получаем все данные
    const [moySkladResponse, allOurCategories] = await Promise.all([
      getMoySkladProductsAndVariants(),
      prisma.category.findMany(),
    ]);

    const moySkladItems: any[] = moySkladResponse.rows || [];
    const categoryMap = new Map(
      allOurCategories.map((cat) => [cat.moyskladId, cat]),
    );

    // 2. Находим товары без артикула
    const productsToFix = moySkladItems.filter(
      (item) => !item.article || item.article.trim() === '',
    );

    if (productsToFix.length === 0) {
      return NextResponse.json({
        message: 'Отлично! Все товары в МойСклад уже имеют артикулы.',
      });
    }

    console.log(`[BACKFILL] Найдено ${productsToFix.length} товаров без артикула.`);

    let updatedCount = 0;
    const errors: string[] = [];

    // 3. Исправляем каждый товар
    for (const msProduct of productsToFix) {
      try {
        // Находим категорию товара
        const categoryMoySkladId = msProduct.productFolder
          ? getUUIDFromHref(msProduct.productFolder.meta.href)
          : null;
        if (!categoryMoySkladId) {
          throw new Error('Не имеет категории');
        }

        // Находим эту категорию в нашей БД, чтобы получить ее ID
        const ourCategory = categoryMap.get(categoryMoySkladId);
        if (!ourCategory) {
          throw new Error(
            `Категория с moyskladId ${categoryMoySkladId} не найдена в нашей БД`,
          );
        }

        // Генерируем новый, правильный артикул
        const newArticle = await generateProductSku(prisma, ourCategory.id);

        // Обновляем товар в МойСклад
        await updateMoySkladArticle(msProduct.id, newArticle);
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