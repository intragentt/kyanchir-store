// Местоположение: /src/app/api/admin/sync/categories/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMoySkladCategories } from '@/lib/moysklad-api';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuthError } from '@/lib/moysklad-api'; // <-- Импортируем нашу специальную ошибку

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
    const synonyms = await prisma.categorySynonym.findMany({
      include: { rule: true },
    });
    const codeMap = new Map(synonyms.map((s) => [s.name, s.rule.assignedCode]));

    const moySkladResponse = await getMoySkladCategories();
    const moySkladCategories: MoySkladCategory[] = moySkladResponse.rows || [];

    if (moySkladCategories.length > 0) {
      await prisma.$transaction(
        moySkladCategories.map((category) => {
          const assignedCode = codeMap.get(category.name);
          const code = assignedCode || `TEMP-${category.id}`;
          return prisma.category.upsert({
            where: { moyskladId: category.id },
            update: { name: category.name },
            create: {
              name: category.name,
              moyskladId: category.id,
              code: code,
            },
          });
        }),
      );
    }

    await prisma.category.updateMany({ data: { parentId: null } });

    const ourCategoriesMap = new Map<string, string>();
    const allOurCategories = await prisma.category.findMany({
      select: { id: true, moyskladId: true },
    });
    allOurCategories.forEach(
      (cat) => cat.moyskladId && ourCategoriesMap.set(cat.moyskladId, cat.id),
    );

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
        }
      }
    }
    if (updatePromises.length > 0) {
      await prisma.$transaction(updatePromises);
    }

    return NextResponse.json({ message: 'Синхронизация категорий завершена.' });
  } catch (error) {
    // --- НАЧАЛО ИЗМЕНЕНИЙ: "Умный" обработчик ошибок ---
    if (error instanceof AuthError) {
      return new NextResponse(JSON.stringify({ error: error.message }), {
        status: 401,
      });
    }
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---
    console.error('[SYNC CATEGORIES ERROR]:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Внутренняя ошибка сервера.' }),
      { status: 500 },
    );
  }
}
