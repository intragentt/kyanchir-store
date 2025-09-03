// Местоположение: src/app/api/variants/batch-update/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Определяем типы для ясности
interface SizeUpdate {
  id: string;
  stock: number;
}
interface VariantUpdate {
  id: string;
  price: number;
  oldPrice?: number | null;
  bonusPoints?: number | null;
  discountExpiresAt?: Date | null;
  sizes: SizeUpdate[];
  // Данные для обновления родительского продукта
  product: {
    id: string;
    status?: { id: string };
    categories?: { id: string }[];
    tags?: { id: string }[];
  };
}

export async function PATCH(req: NextRequest) {
  // --- НАЧАЛО ИЗМЕНЕНИЙ (1/4): Добавляем защиту ---
  const session = await getServerSession(authOptions);
  if (!session || session.user.role?.name !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  // --- КОНЕЦ ИЗМЕНЕНИЙ (1/4) ---

  try {
    const body = await req.json();
    const { variants } = body as { variants: VariantUpdate[] };

    if (!variants || !Array.isArray(variants)) {
      return NextResponse.json(
        { message: 'Неверный формат данных' },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      for (const variant of variants) {
        // --- НАЧАЛО ИЗМЕНЕНИЙ (2/4): Исправляем имя модели 'variant' -> 'productVariant' ---
        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            price: variant.price,
            oldPrice: variant.oldPrice,
            bonusPoints: variant.bonusPoints,
            discountExpiresAt: variant.discountExpiresAt,
          },
        });
        // --- КОНЕЦ ИЗМЕНЕНИЙ (2/4) ---

        // Обновляем родительский продукт (статус, категории, теги)
        const { product } = variant;
        if (product) {
          const productUpdateData: any = {};
          // --- НАЧАЛО ИЗМЕНЕНИЙ (3/4): Исправляем обновление статуса ---
          if (product.status?.id) {
            productUpdateData.statusId = product.status.id;
          }
          // --- КОНЕЦ ИЗМЕНЕНИЙ (3/4) ---
          if (product.categories) {
            productUpdateData.categories = {
              set: product.categories.map((cat) => ({ id: cat.id })),
            };
          }
          if (product.tags) {
            productUpdateData.tags = {
              set: product.tags.map((tag) => ({ id: tag.id })),
            };
          }

          if (Object.keys(productUpdateData).length > 0) {
            await tx.product.update({
              where: { id: product.id },
              data: productUpdateData,
            });
          }
        }

        // --- НАЧАЛО ИЗМЕНЕНИЙ (4/4): Переписываем логику обновления остатков ---
        // Обновляем остатки в модели ProductSize
        if (variant.sizes && variant.sizes.length > 0) {
          const stockUpdatePromises = variant.sizes.map((size) =>
            tx.productSize.update({
              where: { id: size.id },
              data: { stock: size.stock },
            }),
          );
          await Promise.all(stockUpdatePromises);
        }
        // --- КОНЕЦ ИЗМЕНЕНИЙ (4/4) ---
      }
    });

    return NextResponse.json({ message: 'Варианты успешно обновлены' });
  } catch (error: any) {
    console.error('Ошибка при обновлении вариантов:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера', error: error.message },
      { status: 500 },
    );
  }
}
