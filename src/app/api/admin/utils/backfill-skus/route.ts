// /src/app/api/admin/utils/backfill-skus/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  getMoySkladProductsAndVariants,
  getMoySkladEntityByHref,
} from '@/lib/moysklad-api';
import { generateSizeSku, generateVariantSku } from '@/lib/sku-generator';

// --- НАЧАЛО НОВЫХ ТИПОВ ДЛЯ ПЛАНА ---
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
// --- КОНЕЦ НОВЫХ ТИПОВ ---

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

        // --- ШАГ 1: Определяем "правильный" артикул на основе ТЕКУЩЕЙ категории ---
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
          const categoryMoySkladId = msProduct.productFolder
            ? getUUIDFromHref(msProduct.productFolder.meta.href)
            : null;
          if (!categoryMoySkladId) throw new Error('Не имеет категории');
          const ourCategory = categoryMapByMsId.get(categoryMoySkladId);
          if (!ourCategory)
            throw new Error(
              `Категория "${msProduct.productFolder.name}" не найдена в нашей БД`,
            );

          const baseSku = `KYN-${ourCategory.code}`;
          const ourProduct = await prisma.product.findFirst({
            where: { moyskladId: msProduct.id },
          });
          const productCode = ourProduct
            ? ourProduct.id.slice(-4).toUpperCase()
            : 'XXXX';
          expectedArticle = `${baseSku}-${productCode}`;
        }

        // --- ШАГ 2: Анализируем ситуацию ---
        if (!currentArticle) {
          plan.toCreate.push({
            moySkladId: msProduct.id,
            moySkladType: msProduct.meta.type,
            name: msProduct.name,
            expectedArticle,
          });
          continue;
        }

        if (currentArticle.toUpperCase() === expectedArticle.toUpperCase()) {
          plan.okCount++;
          continue;
        }

        // --- ШАГ 3: Если дошли сюда - это КОНФЛИКТ ---
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
