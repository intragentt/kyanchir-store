// /src/app/api/admin/sync/categories/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMoySkladCategories } from '@/lib/moysklad-api';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// Расширяем интерфейс, чтобы видеть данные о родительской папке
interface MoySkladCategory {
  id: string;
  name: string;
  // Поле productFolder содержит ссылку на родительскую категорию
  productFolder?: {
    meta: {
      href: string;
    };
  };
}

// Вспомогательная функция для извлечения ID из URL-ссылки
function getUUIDFromHref(href: string): string {
  return href.split('/').pop() || '';
}

// Мы используем метод POST для ручного запуска синхронизации из админки.
// Запрос должен быть от авторизованного администратора.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== UserRole.ADMIN) {
    return new NextResponse(JSON.stringify({ error: 'Доступ запрещен' }), {
      status: 403,
    });
  }

  try {
    const moySkladResponse = await getMoySkladCategories();
    const moySkladCategories: MoySkladCategory[] = moySkladResponse.rows || [];

    if (moySkladCategories.length === 0) {
      return NextResponse.json({ message: 'Категории в МойСклад не найдены.' });
    }

    // === ШАГ 1: Создаем/обновляем все категории, но пока без связей ===
    // Это гарантирует, что все потенциальные "родители" уже будут существовать
    // в нашей базе данных перед тем, как мы начнем создавать связи на Шаге 2.
    await prisma.$transaction(
      moySkladCategories.map((category) =>
        prisma.category.upsert({
          where: { moyskladId: category.id },
          update: { name: category.name },
          create: { name: category.name, moyskladId: category.id },
        }),
      ),
    );
    console.log(
      '[SYNC CATEGORIES] Шаг 1/2: Все категории успешно созданы/обновлены.',
    );

    // === ШАГ 2: Устанавливаем связи (проставляем parentId) ===
    // Сначала создадим "карту" для быстрого поиска: moyskladId -> наш_внутренний_id
    const ourCategoriesMap = new Map<string, string>();
    const allOurCategories = await prisma.category.findMany({
      select: { id: true, moyskladId: true },
    });
    allOurCategories.forEach(
      (cat) => cat.moyskladId && ourCategoriesMap.set(cat.moyskladId, cat.id),
    );

    // Теперь проходим по списку категорий из "МойСклад" и готовим запросы на обновление parentId
    const updatePromises = moySkladCategories
      .filter((category) => category.productFolder) // Берем только те, у кого есть родитель
      .map((category) => {
        const moyskladParentId = getUUIDFromHref(
          category.productFolder!.meta.href,
        );
        const ourParentId = ourCategoriesMap.get(moyskladParentId); // Находим внутренний ID родителя по карте
        const ourChildId = ourCategoriesMap.get(category.id); // Находим внутренний ID текущей категории

        // Если и родитель, и ребенок найдены в нашей базе, готовим запрос на обновление
        if (ourParentId && ourChildId) {
          return prisma.category.update({
            where: { id: ourChildId },
            data: { parentId: ourParentId }, // Проставляем ID родителя
          });
        }
        return null; // Если кого-то не нашли, пропускаем
      })
      .filter((p) => p !== null) as any[]; // Убираем пропущенные (null)

    // Если есть что обновлять, выполняем все запросы на обновление в одной транзакции
    if (updatePromises.length > 0) {
      await prisma.$transaction(updatePromises);
    }
    console.log(
      `[SYNC CATEGORIES] Шаг 2/2: ${updatePromises.length} родительских связей обновлено.`,
    );

    return NextResponse.json({
      message: 'Синхронизация категорий (с иерархией) успешно завершена.',
      totalCategories: moySkladCategories.length,
      linksUpdated: updatePromises.length,
    });
  } catch (error) {
    console.error('[API SYNC CATEGORIES ERROR]:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Внутренняя ошибка сервера при синхронизации категорий.',
      }),
      { status: 500 },
    );
  }
}
