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
    console.log('[SYNC CATEGORIES] Начинаем интеллектуальную синхронизацию...');

    // --- НАЧАЛО ИЗМЕНЕНИЙ: Загружаем "Словарь" по новой схеме ---
    console.log('[SYNC CATEGORIES] Шаг 0/4: Загрузка словаря синонимов...');
    const synonyms = await prisma.categorySynonym.findMany({
      include: {
        rule: true, // Включаем родительское правило, чтобы получить код
      },
    });

    // Создаем карту: "Название синонима" -> "Присвоенный код"
    const codeMap = new Map(synonyms.map((s) => [s.name, s.rule.assignedCode]));
    console.log(
      `[SYNC CATEGORIES] Словарь успешно загружен, ${codeMap.size} правил активно.`,
    );
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    const moySkladResponse = await getMoySkladCategories();
    const moySkladCategories: MoySkladCategory[] = moySkladResponse.rows || [];

    if (moySkladCategories.length === 0) {
      return NextResponse.json({ message: 'Категории в МойСклад не найдены.' });
    }
    console.log(
      `[SYNC CATEGORIES] Найдено ${moySkladCategories.length} категорий в МойСклад.`,
    );

    // ШАГ 1: Upsert всех категорий
    await prisma.$transaction(
      moySkladCategories.map((category) => {
        // --- НАЧАЛО ИЗМЕНЕНИЙ: Используем "Словарь" ---
        const assignedCode = codeMap.get(category.name);
        const code = assignedCode || `TEMP-${category.id}`; // Если нет в словаре, ставим TEMP
        // --- КОНЕЦ ИЗМЕНЕНИЙ ---

        return prisma.category.upsert({
          where: { moyskladId: category.id },
          update: { name: category.name },
          create: {
            name: category.name,
            moyskladId: category.id,
            code: code, // <-- Присваиваем правильный или временный код
          },
        });
      }),
    );
    console.log(
      '[SYNC CATEGORIES] Шаг 1/4: Все категории успешно созданы/обновлены.',
    );

    // ШАГ 2: Сброс старых связей
    await prisma.category.updateMany({ data: { parentId: null } });
    console.log(
      '[SYNC CATEGORIES] Шаг 2/4: Все старые родительские связи сброшены.',
    );

    // ШАГ 3: Установка новых связей
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
      `[SYNC CATEGORIES] Шаг 3/4: Установлено ${linksUpdatedCount} новых родительских связей.`,
    );

    return NextResponse.json({
      message: 'Синхронизация категорий завершена.',
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
