// Местоположение: src/app/api/admin/filters/update/route.ts
// --- НАЧАЛО ИЗМЕНЕНИЙ ---

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
      await tx.presetItem.deleteMany({
        where: {
          presetId: presetId,
        },
      });

      if (items.length > 0) {
        await tx.presetItem.createMany({
          // ИЗМЕНЕНО: Мы явно указываем TypeScript, какой тип у `item`.
          // Это напрямую исправляет вторую ошибку "неявно имеет тип any".
          data: items.map((item: { categoryId: string; order: number }) => ({
            presetId: presetId,
            categoryId: item.categoryId,
            order: item.order,
            type: 'CATEGORY',
          })),
        });
      }
    });

    return NextResponse.json({ message: 'Filter updated successfully' });
  } catch (error) {
    console.error('Error updating filter preset:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---
