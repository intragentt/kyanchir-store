// Местоположение: src/app/api/admin/filters/update/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const updateFilterSchema = z.object({
  presetId: z.string().cuid(),
  items: z.array(
    z.object({
      categoryId: z.string().cuid(),
      order: z.number().int(),
    }),
  ),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = updateFilterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validation.error.issues },
        { status: 400 },
      );
    }

    const { presetId, items } = validation.data;

    await prisma.$transaction(async (tx) => {
      // Сначала удаляем все старые связи для этого пресета
      await tx.presetItem.deleteMany({
        where: {
          presetId: presetId,
        },
      });

      // Если есть новые элементы для добавления
      if (items.length > 0) {
        // --- НАЧАЛО ИЗМЕНЕНИЙ: ИСПРАВЛЯЕМ ОШИБКУ ТИПОВ ---

        // 1. Находим ID для типа 'CATEGORY' один раз, чтобы не делать это в цикле.
        const categoryType = await tx.presetItemType.findUnique({
          where: { name: 'CATEGORY' },
          select: { id: true },
        });

        // 2. Если по какой-то причине такой тип не найден в базе, выдаем ошибку.
        if (!categoryType) {
          throw new Error(
            "PresetItemType 'CATEGORY' not found in the database.",
          );
        }

        // 3. Создаем записи, добавляя обязательное поле typeId.
        await tx.presetItem.createMany({
          data: items.map((item) => ({
            presetId: presetId,
            categoryId: item.categoryId,
            order: item.order,
            typeId: categoryType.id, // Вот недостающее поле!
          })),
        });

        // --- КОНЕЦ ИЗМЕНЕНИЙ ---
      }
    });

    return NextResponse.json({ message: 'Filter updated successfully' });
  } catch (error) {
    console.error('Error updating filter preset:', error);
    // Проверяем, является ли ошибка экземпляром Error, чтобы получить message
    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
