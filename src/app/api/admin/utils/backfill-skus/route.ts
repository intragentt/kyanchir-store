// /src/app/api/admin/utils/backfill-skus/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  getMoySkladProductsAndVariants,
  getMoySkladEntityByHref,
} from '@/lib/moysklad-api';
// --- НАЧАЛО ИЗМЕНЕНИЙ: Импортируем "УМНЫЙ" генератор ---
import {
  generateProductSku,
  generateSizeSku,
  generateVariantSku,
} from '@/lib/sku-generator';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---
import { format } from 'date-fns';

export interface SkuConflict {
  moySkladId: string;
  moySkladType: 'product' | 'variant';
  name: string;
  currentArticle: string;
  currentCategory: { id: string; name: string };
  expectedArticle: string;
  expectedCategoryFromArticle: {
    id: string;
    name: string;
    code: string;
  } | null;
}
export interface SkuToCreate {
  moySkladId: string;
  moySkladType: 'product' | 'variant';
  name: string;
  expectedArticle: string;
}
export interface SkuResolutionPlan {
  conflicts: SkuConflict[];
  toCreate: SkuToCreate[];
  okCount: number;
  errors: string[];
}

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
    console.log(
      '[CONFLICT-DETECTION] Запуск операции "Поиск конфликтов артикулов"...',
    );

    const [moySkladResponse, allOurCategories] = await Promise.all([
      getMoySkladProductsAndVariants(),
      prisma.category.findMany(),
    ]);

    const moySkladItems: any[] = moySkladResponse.rows || [];
    const categoryMapByMsId = new Map(
      allOurCategories.map((cat) => [cat.moyskladId, cat]),
    );
    const categoryMapByCode = new Map(
      allOurCategories.map((cat) => [cat.code, cat]),
    );

    const plan: SkuResolutionPlan = {
      conflicts: [],
      toCreate: [],
      okCount: 0,
      errors: [],
    };
    const parentProductCache = new Map<string, any>();

    for (const msProduct of moySkladItems) {
      try {
        const currentArticle = msProduct.article || '';
        let expectedArticle: string;

        // --- НАЧАЛО ИЗМЕНЕНИЙ: Полностью новая логика определения "правильного" артикула ---
        if (msProduct.meta.type === 'variant') {
          const parentHref = msProduct.product.meta.href;
          let parentProduct = parentProductCache.get(parentHref);
          if (!parentProduct) {
            parentProduct = await getMoySkladEntityByHref(parentHref);
            parentProductCache.set(parentHref, parentProduct);
          }
          if (!parentProduct.article)
            throw new Error(
              `Родитель ${parentProduct.name} не имеет артикула.`,
            );
          const baseVariantArticle = generateVariantSku(
            parentProduct.article,
            0,
          );
          const sizeChar =
            msProduct.characteristics?.find((c: any) => c.name === 'Размер')
              ?.value || 'ONE_SIZE';
          expectedArticle = generateSizeSku(baseVariantArticle, sizeChar);
        } else {
          // Для обычных товаров
          const categoryMoySkladId = msProduct.productFolder
            ? getUUIDFromHref(msProduct.productFolder.meta.href)
            : null;
          if (!categoryMoySkladId) throw new Error('Не имеет категории');
          const ourCategory = categoryMapByMsId.get(categoryMoySkladId);
          if (!ourCategory)
            throw new Error(
              `Категория "${msProduct.productFolder.name}" не найдена в нашей БД`,
            );

          // 1. Генерируем "правильный" префикс
          const datePart = format(new Date(), 'MMyy');
          const expectedPrefix = `KYN-${ourCategory.code}-${datePart}`;

          // 2. Проверяем, соответствует ли текущий артикул маске
          if (
            currentArticle.startsWith(expectedPrefix) &&
            currentArticle.length > expectedPrefix.length + 1
          ) {
            // Артикул уже правильный, ничего не делаем
            plan.okCount++;
            continue;
          }

          // 3. Если артикул пустой или не соответствует маске - генерируем НОВЫЙ "умным" генератором
          // Это единственное место, где вызывается транзакционный генератор
          expectedArticle = await generateProductSku(prisma, ourCategory.id);
        }
        // --- КОНЕЦ ИЗМЕНЕНИЙ ---

        if (!currentArticle) {
          plan.toCreate.push({
            moySkladId: msProduct.id,
            moySkladType: msProduct.meta.type,
            name: msProduct.name,
            expectedArticle,
          });
          continue;
        }

        const codeFromArticle = currentArticle.split('-')[1];
        const expectedCategoryFromArticle =
          categoryMapByCode.get(codeFromArticle) || null;

        plan.conflicts.push({
          moySkladId: msProduct.id,
          moySkladType: msProduct.meta.type,
          name: msProduct.name,
          currentArticle: currentArticle,
          currentCategory: {
            id: msProduct.productFolder
              ? getUUIDFromHref(msProduct.productFolder.meta.href)
              : '',
            name: msProduct.productFolder
              ? msProduct.productFolder.name
              : 'Без категории',
          },
          expectedArticle: expectedArticle,
          expectedCategoryFromArticle: expectedCategoryFromArticle
            ? {
                id: expectedCategoryFromArticle.moyskladId!,
                name: expectedCategoryFromArticle.name,
                code: expectedCategoryFromArticle.code,
              }
            : null,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          `[CONFLICT-DETECTION] Ошибка при обработке ${msProduct.name}: ${errorMessage}`,
        );
        plan.errors.push(`${msProduct.name}: ${errorMessage}`);
      }
    }

    console.log('[CONFLICT-DETECTION] Операция завершена.');
    return NextResponse.json({ plan });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[CONFLICT-DETECTION ERROR]:', errorMessage);
    return new NextResponse(
      JSON.stringify({ error: `Критическая ошибка: ${errorMessage}` }),
      { status: 500 },
    );
  }
}
