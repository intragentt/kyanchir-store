// Местоположение: src/app/admin/categories/actions.ts
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import {
  createRuleWithSynonym as createRuleInMappings,
  addSynonymToRule as addSynonymInMappings,
} from '../mappings/actions';

const pathToRevalidate = '/admin/categories';

// --- CATEGORY ACTIONS ---
export async function createCategory(
  name: string,
  code: string,
  parentId: string | null,
) {
  if (!name || name.trim() === '')
    return { error: 'Название не может быть пустым.' };
  if (!code || code.trim() === '')
    return { error: 'Код не может быть пустым.' };

  await prisma.category.create({
    data: {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      ...(parentId && { parentId }),
    },
  });
  revalidatePath(pathToRevalidate);
}

export async function updateCategory(
  id: string,
  data: { name?: string; color?: string; code?: string },
) {
  if (data.name !== undefined && data.name.trim() === '') {
    return { error: 'Название не может быть пустым.' };
  }
  if (data.code !== undefined && data.code.trim() === '') {
    return { error: 'Код не может быть пустым.' };
  }

  const dataToUpdate = { ...data };
  if (dataToUpdate.code) {
    dataToUpdate.code = dataToUpdate.code.toUpperCase();
  }

  await prisma.category.update({ where: { id }, data: dataToUpdate });
  revalidatePath(pathToRevalidate);
}

export async function deleteCategory(id: string) {
  await prisma.$transaction(async (tx) => {
    const children = await tx.category.findMany({ where: { parentId: id } });
    for (const child of children) {
      await deleteCategory(child.id);
    }
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

export async function updateTag(
  id: string,
  data: { name?: string; color?: string },
) {
  if (data.name !== undefined && data.name.trim() === '') {
    return { error: 'Название не может быть пустым.' };
  }
  await prisma.tag.update({ where: { id }, data });
  revalidatePath(pathToRevalidate);
}

export async function deleteTag(id: string) {
  await prisma.tag.delete({ where: { id } });
  revalidatePath(pathToRevalidate);
}

// --- НОВАЯ СУПЕР-ФУНКЦИЯ ДЛЯ СОХРАНЕНИЯ ВСЕХ ИЗМЕНЕНИЙ ---
export async function saveAllClassifications(
  categories: {
    id: string;
    name: string;
    code: string;
    color: string | null;
    parentId: string | null;
    order: number;
  }[],
  tags: { id: string; name: string; color: string | null; order: number }[],
) {
  await prisma.$transaction([
    ...categories.map((cat) =>
      prisma.category.update({
        where: { id: cat.id },
        data: {
          name: cat.name,
          color: cat.color,
          parentId: cat.parentId,
          order: cat.order,
          code: cat.code.toUpperCase(),
        },
      }),
    ),
    ...tags.map((tag) =>
      prisma.tag.update({
        where: { id: tag.id },
        data: {
          name: tag.name,
          color: tag.color,
          order: tag.order,
        },
      }),
    ),
  ]);

  revalidatePath(pathToRevalidate);
  revalidatePath('/admin/dashboard');
}

// --- ФУНКЦИИ-ОБЕРТКИ ДЛЯ РАБОТЫ СО СЛОВАРЕМ ---
export async function createRuleWithSynonym(
  assignedCode: string,
  synonymName: string,
) {
  return createRuleInMappings(assignedCode, synonymName);
}

export async function addSynonymToRule(ruleId: string, synonymName: string) {
  return addSynonymInMappings(ruleId, synonymName);
}
