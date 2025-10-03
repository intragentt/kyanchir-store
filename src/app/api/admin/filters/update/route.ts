// Местоположение: src/app/api/variants/batch-update/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BatchUpdateVariantsSchema } from '@/lib/schemas/api';
import { ZodError } from 'zod';

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role?.name !== 'ADMIN') {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Zod валидация входных данных
    const validatedData = BatchUpdateVariantsSchema.parse(body);
    const { variants } = validatedData;

    await prisma.$transaction(async (tx) => {
      for (const variant of variants) {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            price: variant.price,
            oldPrice: variant.oldPrice,
            bonusPoints: variant.bonusPoints,
            discountExpiresAt: variant.discountExpiresAt,
          },
        });

        // Обновляем родительский продукт
        const { product } = variant;
        if (product) {
          const productUpdateData: any = {};

          if (product.status?.id) {
            productUpdateData.statusId = product.status.id;
          }
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

        // Обновляем остатки
        if (variant.sizes && variant.sizes.length > 0) {
          const stockUpdatePromises = variant.sizes.map((size) =>
            tx.productSize.update({
              where: { id: size.id },
              data: { stock: size.stock },
            }),
          );
          await Promise.all(stockUpdatePromises);
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Варианты успешно обновлены',
    });
  } catch (error) {
    console.error('Ошибка при обновлении вариантов:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Ошибка валидации данных',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 },
    );
  }
}
