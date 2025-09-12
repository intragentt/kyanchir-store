// Местоположение: /src/app/api/admin/sync/categories/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMoySkladCategories } from '@/lib/moysklad-api';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface MoySkladCategory {
  id: string;
  name: string;
  productFolder?: { meta: { href: string } };
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
    console.log('[SYNC CATEGORIES] Начинаем синхронизацию категорий...');
    const moySkladResponse = await getMoySkladCategories();
    const moySkladCategories: MoySkladCategory[] = moySkladResponse.rows || [];

    if (moySkladCategories.length === 0) {
      console.log(
        '[SYNC CATEGORIES] В МойСклад не найдено ни одной категории.',
      );
      return NextResponse.json({ message: 'Категории в МойСклад не найдены.' });
    }
    console.log(
      `[SYNC CATEGORIES] Найдено ${moySkladCategories.length} категорий в МойСклад.`,
    );

    // ШАГ 1: Upsert всех категорий (создание/обновление)
    await prisma.$transaction(
      moySkladCategories.map((category) =>
        prisma.category.upsert({
          where: { moyskladId: category.id },
          update: { name: category.name },
          // --- НАЧАЛО ИЗМЕНЕНИЯ ---
          create: {
            name: category.name,
            moyskladId: category.id,
            // Добавляем временный код, чтобы new-категория прошла валидацию.
            // Используем ID из МойСклад, чтобы гарантировать уникальность.
            code: `TEMP-${category.id}`,
          },
          // --- КОНЕЦ ИЗМЕНЕНИЯ ---
        }),
      ),
    );
    console.log(
      '[SYNC CATEGORIES] Шаг 1/3: Все категории успешно созданы/обновлены в нашей БД.',
    );

    // ШАГ 2: Сброс всех существующих связей parentId на null.
    await prisma.category.updateMany({
      data: { parentId: null },
    });
    console.log(
      '[SYNC CATEGORIES] Шаг 2/3: Все старые родительские связи сброшены.',
    );

    // ШАГ 3: Установка новых, актуальных связей
    const ourCategoriesMap = new Map<string, string>();
    const allOurCategories = await prisma.category.findMany({
      select: { id: true, moyskladId: true },
    });
    allOurCategories.forEach(
      (cat) => cat.moyskladId && ourCategoriesMap.set(cat.moyskladId, cat.id),
    );

    let linksUpdatedCount = 0;
    const updatePromises = [];

    for (const category of moySkladCategories) {
      if (category.productFolder) {
        const moyskladParentId = getUUIDFromHref(
          category.productFolder.meta.href,
        );
        const ourParentId = ourCategoriesMap.get(moyskladParentId);
        const ourChildId = ourCategoriesMap.get(category.id);

        if (ourParentId && ourChildId) {
          updatePromises.push(
            prisma.category.update({
              where: { id: ourChildId },
              data: { parentId: ourParentId },
            }),
          );
          linksUpdatedCount++;
        }
      }
    }

    if (updatePromises.length > 0) {
      await prisma.$transaction(updatePromises);
    }
    console.log(
      `[SYNC CATEGORIES] Шаг 3/3: Установлено ${linksUpdatedCount} новых родительских связей.`,
    );

    return NextResponse.json({
      message: 'Синхронизация категорий с иерархией завершена.',
      totalFound: moySkladCategories.length,
      linksEstablished: linksUpdatedCount,
    });
  } catch (error) {
    console.error('[SYNC CATEGORIES ERROR]:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Внутренняя ошибка сервера.' }),
      { status: 500 },
    );
  }
}