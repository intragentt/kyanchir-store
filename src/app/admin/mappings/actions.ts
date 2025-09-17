// Местоположение: /src/app/admin/mappings/actions.ts
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const pathToRevalidate = '/admin/mappings';

/**
 * Получает все правила из "Словаря".
 */
export async function getMappings() {
  return await prisma.categoryCodeMapping.findMany({
    orderBy: { categoryName: 'asc' },
  });
}

/**
 * Создает новое правило в "Словаре".
 */
export async function createMapping(
  categoryName: string,
  assignedCode: string,
) {
  if (!categoryName.trim() || !assignedCode.trim()) {
    return { error: 'Название и код не могут быть пустыми.' };
  }
  await prisma.categoryCodeMapping.create({
    data: {
      categoryName: categoryName.trim(),
      assignedCode: assignedCode.trim().toUpperCase(),
    },
  });
  revalidatePath(pathToRevalidate);
}

/**
 * Удаляет правило из "Словаря".
 */
export async function deleteMapping(id: string) {
  await prisma.categoryCodeMapping.delete({ where: { id } });
  revalidatePath(pathToRevalidate);
}
