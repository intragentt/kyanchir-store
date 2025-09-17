// Местоположение: /src/app/admin/mappings/actions.ts
'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const pathToRevalidate = '/admin/mappings';

// Определяем единый, предсказуемый тип для возвращаемых значений
type ActionResult = { success: boolean; error?: string };

/**
 * Получает все правила кодов вместе с их синонимами.
 * Эта функция для чтения, поэтому в случае ошибки она должна "сломать" страницу.
 */
export async function getMappings() {
  return await prisma.codeRule.findMany({
    include: {
      synonyms: true,
    },
    orderBy: { assignedCode: 'asc' },
  });
}

/**
 * Создает новое правило и его первый синоним.
 */
export async function createRuleWithSynonym(
  assignedCode: string,
  synonymName: string,
): Promise<ActionResult> {
  try {
    if (!assignedCode.trim() || !synonymName.trim()) {
      return { success: false, error: 'Код и синоним не могут быть пустыми.' };
    }

    const existingRule = await prisma.codeRule.findUnique({
      where: { assignedCode: assignedCode.trim().toUpperCase() },
    });

    if (existingRule) {
      return { success: false, error: 'Такой код уже существует.' };
    }

    const existingSynonym = await prisma.categorySynonym.findUnique({
      where: { name: synonymName.trim() },
    });

    if (existingSynonym) {
      return {
        success: false,
        error: 'Такой синоним уже используется в другом правиле.',
      };
    }

    await prisma.codeRule.create({
      data: {
        assignedCode: assignedCode.trim().toUpperCase(),
        synonyms: {
          create: {
            name: synonymName.trim(),
          },
        },
      },
    });

    revalidatePath(pathToRevalidate);
    return { success: true };
  } catch (e) {
    console.error('Error in createRuleWithSynonym:', e);
    return { success: false, error: 'Не удалось создать правило.' };
  }
}

/**
 * Добавляет новый синоним к существующему правилу.
 */
export async function addSynonymToRule(
  ruleId: string,
  synonymName: string,
): Promise<ActionResult> {
  try {
    if (!synonymName.trim()) {
      return { success: false, error: 'Синоним не может быть пустым.' };
    }

    const existingSynonym = await prisma.categorySynonym.findUnique({
      where: { name: synonymName.trim() },
    });

    if (existingSynonym) {
      return {
        success: false,
        error: 'Такой синоним уже используется в другом правиле.',
      };
    }

    await prisma.categorySynonym.create({
      data: {
        name: synonymName.trim(),
        ruleId: ruleId,
      },
    });

    revalidatePath(pathToRevalidate);
    return { success: true };
  } catch (e) {
    console.error('Error in addSynonymToRule:', e);
    return { success: false, error: 'Не удалось добавить синоним.' };
  }
}

/**
 * Удаляет один синоним. Если это был последний синоним, удаляет и само правило.
 */
export async function deleteSynonym(synonymId: string): Promise<ActionResult> {
  try {
    const synonym = await prisma.categorySynonym.findUnique({
      where: { id: synonymId },
      include: {
        rule: {
          include: {
            _count: {
              select: { synonyms: true },
            },
          },
        },
      },
    });

    if (!synonym) {
      return { success: false, error: 'Синоним не найден.' };
    }

    if (synonym.rule._count.synonyms === 1) {
      await prisma.codeRule.delete({ where: { id: synonym.ruleId } });
    } else {
      await prisma.categorySynonym.delete({ where: { id: synonymId } });
    }

    revalidatePath(pathToRevalidate);
    return { success: true };
  } catch (e) {
    console.error('Error in deleteSynonym:', e);
    return { success: false, error: 'Не удалось удалить синоним.' };
  }
}

/**
 * Полностью удаляет правило и все связанные с ним синонимы.
 */
export async function deleteRule(ruleId: string): Promise<ActionResult> {
  try {
    await prisma.codeRule.delete({ where: { id: ruleId } });
    revalidatePath(pathToRevalidate);
    return { success: true };
  } catch (e) {
    console.error('Error in deleteRule:', e);
    return { success: false, error: 'Не удалось удалить правило.' };
  }
}
