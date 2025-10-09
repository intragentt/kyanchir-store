import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z, ZodError } from 'zod';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

const ALLOWED_ROLES = new Set(['ADMIN', 'MANAGEMENT']);

const filterUpdateSchema = z
  .object({
    presetId: z.string().min(1),
    items: z
      .array(
        z.object({
          categoryId: z.string().min(1),
          order: z.number().int().min(0),
        }),
      )
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.items) {
      return;
    }

    const seen = new Set<string>();

    for (const item of value.items) {
      if (seen.has(item.categoryId)) {
        ctx.addIssue({
          path: ['items'],
          code: z.ZodIssueCode.custom,
          message: 'Категория указана несколько раз',
        });
        break;
      }
      seen.add(item.categoryId);
    }
  });

async function ensureAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.role?.name || !ALLOWED_ROLES.has(session.user.role.name)) {
    return null;
  }

  return session;
}

async function upsertCategoryPresetItems(presetId: string, categoryIds: string[]) {
  return prisma.$transaction(async (tx) => {
    const preset = await tx.filterPreset.findUnique({ where: { id: presetId } });

    if (!preset) {
      throw new Error('Фильтр не найден');
    }

    const [type, categories] = await Promise.all([
      tx.presetItemType.upsert({
        where: { name: 'CATEGORY' },
        update: {},
        create: { name: 'CATEGORY' },
      }),
      categoryIds.length
        ? tx.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true },
          })
        : Promise.resolve([]),
    ]);

    if (categoryIds.length !== categories.length) {
      throw new Error('Некоторые категории не найдены');
    }

    await tx.presetItem.deleteMany({ where: { presetId, typeId: type.id } });

    if (categoryIds.length === 0) {
      return [] as const;
    }

    await tx.presetItem.createMany({
      data: categoryIds.map((categoryId, index) => ({
        presetId,
        typeId: type.id,
        categoryId,
        order: index,
      })),
    });

    return categoryIds;
  });
}

export async function POST(request: Request) {
  const session = await ensureAdmin();

  if (!session) {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
  }

  try {
    const payload = await request.json();
    const parsed = filterUpdateSchema.parse(payload);

    const sortedCategoryIds =
      parsed.items?.slice().sort((a, b) => a.order - b.order).map((item) => item.categoryId) ?? [];

    await upsertCategoryPresetItems(parsed.presetId, sortedCategoryIds);

    const updatedPreset = await prisma.filterPreset.findUnique({
      where: { id: parsed.presetId },
      include: {
        items: {
          orderBy: { order: 'asc' },
          include: {
            category: true,
          },
        },
      },
    });

    revalidatePath('/admin/filters');
    revalidatePath('/admin/categories');

    return NextResponse.json({
      message: 'Фильтр обновлён',
      data: {
        presetId: parsed.presetId,
        items: updatedPreset?.items
          .filter((item) => item.category)
          .map((item) => ({
            id: item.id,
            categoryId: item.categoryId!,
            order: item.order,
            categoryName: item.category!.name,
          })) ?? [],
      },
    });
  } catch (error) {
    console.error('[admin/filters/update] Ошибка', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Некорректный формат запроса' }, { status: 400 });
    }

    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Проверьте введённые данные', details: error.issues }, { status: 422 });
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : 'Не удалось обновить фильтр' }, { status: 500 });
  }
}
