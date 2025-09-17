// Местоположение: /src/app/api/admin/sync/dry-run/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMoySkladCategories } from '@/lib/moysklad-api';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface MoySkladCategory {
  id: string;
  name: string;
}

// Определяем типы для нашего "плана"
export interface SyncPlan {
  toCreate: {
    moyskladId: string;
    name: string;
    assignedCode: string | null;
  }[];
  toUpdate: {
    ourId: string;
    moyskladId: string;
    oldName: string;
    newName: string;
  }[];
  noAction: {
    ourId: string;
    moyskladId: string;
    name: string;
  }[];
  warnings: {
    moyskladId: string;
    name: string;
    reason: string;
  }[];
}

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role?.name !== 'ADMIN') {
    return new NextResponse(JSON.stringify({ error: 'Доступ запрещен' }), {
      status: 403,
    });
  }

  try {
    console.log('[DRY RUN] Начинаем предпросмотр синхронизации...');

    // 1. Получаем все данные параллельно для эффективности
    const [moySkladResponse, ourCategories, synonyms] = await Promise.all([
      getMoySkladCategories(),
      prisma.category.findMany(),
      prisma.categorySynonym.findMany({ include: { rule: true } }),
    ]);

    const moySkladCategories: MoySkladCategory[] = moySkladResponse.rows || [];

    // 2. Создаем удобные структуры для быстрого доступа
    const codeMap = new Map(synonyms.map((s) => [s.name, s.rule.assignedCode]));
    const ourCategoriesMap = new Map(
      ourCategories.map((c) => [c.moyskladId, c]),
    );

    console.log(
      `[DRY RUN] Загружено: ${moySkladCategories.length} категорий из МС, ${ourCategories.length} из нашей БД, ${codeMap.size} правил в словаре.`,
    );

    // 3. Инициализируем наш план
    const plan: SyncPlan = {
      toCreate: [],
      toUpdate: [],
      noAction: [],
      warnings: [],
    };

    // 4. Анализируем каждую категорию из МойСклад и распределяем по плану
    for (const msCategory of moySkladCategories) {
      const ourCategory = ourCategoriesMap.get(msCategory.id);
      const assignedCode = codeMap.get(msCategory.name) || null;

      if (!assignedCode) {
        plan.warnings.push({
          moyskladId: msCategory.id,
          name: msCategory.name,
          reason:
            'Не найдено правило в "Словаре". Будет присвоен временный код.',
        });
      }

      if (!ourCategory) {
        // Категория есть в МС, но нет у нас -> нужно создать
        plan.toCreate.push({
          moyskladId: msCategory.id,
          name: msCategory.name,
          assignedCode,
        });
      } else {
        // Категория есть и у нас, и в МС
        if (ourCategory.name !== msCategory.name) {
          // Имена отличаются -> нужно обновить
          plan.toUpdate.push({
            ourId: ourCategory.id,
            moyskladId: msCategory.id,
            oldName: ourCategory.name,
            newName: msCategory.name,
          });
        } else {
          // Имена совпадают -> ничего не делаем
          plan.noAction.push({
            ourId: ourCategory.id,
            moyskladId: msCategory.id,
            name: msCategory.name,
          });
        }
        // Удаляем из карты, чтобы в конце найти "сирот"
        ourCategoriesMap.delete(msCategory.id);
      }
    }

    // 5. Проверяем "сирот" - категории, которые есть у нас, но уже удалены в МойСклад
    for (const orphan of ourCategoriesMap.values()) {
      plan.warnings.push({
        moyskladId: orphan.moyskladId!,
        name: orphan.name,
        reason:
          'Категория существует в нашей базе, но отсутствует в "МойСклад". Может потребоваться удаление вручную.',
      });
    }

    console.log('[DRY RUN] План синхронизации успешно сформирован.');

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('[DRY RUN ERROR]:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Внутренняя ошибка сервера при формировании плана.',
      }),
      { status: 500 },
    );
  }
}
