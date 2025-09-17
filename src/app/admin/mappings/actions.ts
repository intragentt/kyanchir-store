// Местоположение: /src/app/admin/mappings/actions.ts
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const pathToRevalidate = '/admin/mappings';

export async function getMappings() {
  return await prisma.categoryCodeMapping.findMany({
    orderBy: { categoryName: 'asc' },
  });
}

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

// --- НАЧАЛО НОВОГО КОДА ---
/**
 * Обновляет существующее правило в "Словаре".
 */
export async function updateMapping(
  id: string,
  data: { categoryName?: string; assignedCode?: string },
) {
  if (data.categoryName !== undefined && data.categoryName.trim() === '') {
    return { error: 'Название не может быть пустым.' };
  }
  if (data.assignedCode !== undefined && data.assignedCode.trim() === '') {
    return { error: 'Код не может быть пустым.' };
  }

  const dataToUpdate = { ...data };
  if (dataToUpdate.assignedCode) {
    dataToUpdate.assignedCode = dataToUpdate.assignedCode.toUpperCase();
  }

  await prisma.categoryCodeMapping.update({
    where: { id },
    data: dataToUpdate,
  });
  revalidatePath(pathToRevalidate);
}
// --- КОНЕЦ НОВОГО КОДА ---

export async function deleteMapping(id: string) {
  await prisma.categoryCodeMapping.delete({ where: { id } });
  revalidatePath(pathToRevalidate);
}
