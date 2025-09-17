// Местоположение: /src/app/api/admin/utils/execute-sku-plan/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
  updateMoySkladArticle,
  updateMoySkladProductFolder,
} from '@/lib/moysklad-api';
// --- ИСПРАВЛЕННЫЙ ПУТЬ ИМПОРТА ---
import type { SkuResolutionPlan } from '../backfill-skus/route';
import type { UserResolutions } from '@/components/admin/ConflictResolutionModal';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role?.name !== 'ADMIN') {
    return new NextResponse(JSON.stringify({ error: 'Доступ запрещен' }), {
      status: 403,
    });
  }

  try {
    const {
      plan,
      resolutions,
    }: { plan: SkuResolutionPlan; resolutions: UserResolutions } =
      await req.json();

    if (!plan || !resolutions) {
      return new NextResponse(
        JSON.stringify({ error: 'Не предоставлен план или решения' }),
        { status: 400 },
      );
    }

    console.log('[EXECUTE-SKU-PLAN] Запуск выполнения плана...');

    let articlesFixed = 0;
    let categoriesReverted = 0;
    let articlesCreated = 0;
    const errors: string[] = [];

    const allPromises = [];

    // 1. Обрабатываем конфликты, по которым есть решения
    for (const conflict of plan.conflicts) {
      const resolution = resolutions[conflict.moySkladId];
      if (!resolution) continue;

      if (resolution === 'FIX_SKU') {
        allPromises.push(
          updateMoySkladArticle(
            conflict.moySkladId,
            conflict.expectedArticle,
            conflict.moySkladType,
          )
            .then(() => articlesFixed++)
            .catch((e) => errors.push(`${conflict.name}: ${e.message}`)),
        );
      } else if (
        resolution === 'REVERT_CATEGORY' &&
        conflict.expectedCategoryFromArticle
      ) {
        allPromises.push(
          updateMoySkladProductFolder(
            conflict.moySkladId,
            conflict.expectedCategoryFromArticle.id,
          )
            .then(() => categoriesReverted++)
            .catch((e) => errors.push(`${conflict.name}: ${e.message}`)),
        );
      }
    }

    // 2. Создаем недостающие артикулы
    for (const item of plan.toCreate) {
      allPromises.push(
        updateMoySkladArticle(
          item.moySkladId,
          item.expectedArticle,
          item.moySkladType,
        )
          .then(() => articlesCreated++)
          .catch((e) => errors.push(`${item.name}: ${e.message}`)),
      );
    }

    await Promise.all(allPromises);

    console.log('[EXECUTE-SKU-PLAN] Выполнение плана завершено.');

    return NextResponse.json({
      message: 'План успешно выполнен!',
      articlesFixed,
      categoriesReverted,
      articlesCreated,
      errors,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[EXECUTE-SKU-PLAN ERROR]:', errorMessage);
    return new NextResponse(
      JSON.stringify({ error: `Критическая ошибка: ${errorMessage}` }),
      { status: 500 },
    );
  }
}
