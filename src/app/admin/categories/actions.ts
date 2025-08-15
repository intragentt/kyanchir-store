// Местоположение: src/app/admin/categories/actions.ts
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const pathToRevalidate = '/admin/categories';

// --- CATEGORY ACTIONS ---
export async function createCategory(name: string, parentId: string | null) {
  if (!name || name.trim() === '')
    return { error: 'Название не может быть пустым.' };
  await prisma.category.create({
    data: { name: name.trim(), ...(parentId && { parentId }) },
  });
  revalidatePath(pathToRevalidate);
}

export async function updateCategory(id: string, name: string) {
  if (!name || name.trim() === '')
    return { error: 'Название не может быть пустым.' };
  await prisma.category.update({ where: { id }, data: { name: name.trim() } });
  revalidatePath(pathToRevalidate);
}

export async function deleteCategory(id: string) {
  await prisma.$transaction(async (tx) => {
    await tx.category.updateMany({
      where: { parentId: id },
      data: { parentId: null },
    });
    await tx.category.delete({ where: { id } });
  });
  revalidatePath(pathToRevalidate);
}

// --- TAG ACTIONS ---
export async function createTag(name: string) {
  if (!name || name.trim() === '')
    return { error: 'Название не может быть пустым.' };
  await prisma.tag.create({ data: { name: name.trim() } });
  revalidatePath(pathToRevalidate);
}

export async function updateTag(id: string, name: string) {
  if (!name || name.trim() === '')
    return { error: 'Название не может быть пустым.' };
  await prisma.tag.update({ where: { id }, data: { name: name.trim() } });
  revalidatePath(pathToRevalidate);
}

export async function deleteTag(id: string) {
  await prisma.tag.delete({ where: { id } });
  revalidatePath(pathToRevalidate);
}
