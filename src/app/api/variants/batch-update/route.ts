// Местоположение: src/app/api/variants/batch-update/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { variants } = body;

    if (!variants || !Array.isArray(variants)) {
      return NextResponse.json(
        { message: 'Неверный формат данных' },
        { status: 400 },
      );
    }

    await prisma.$transaction(
      async (tx) => {
        for (const variant of variants) {
          const product = variant.product;
          const inventoryUpdatePromises = [];

          // 1. Обновляем сам вариант (цены, бонусы, И ТАЙМЕР)
          await tx.variant.update({
            where: { id: variant.id },
            data: {
              price: variant.price,
              oldPrice: variant.oldPrice,
              bonusPoints: variant.bonusPoints,
              // --- НАЧАЛО ИЗМЕНЕНИЙ: Добавлена эта строка ---
              discountExpiresAt: variant.discountExpiresAt,
              // --- КОНЕЦ ИЗМЕНЕНИЙ ---
            },
          });

          const productUpdateData: any = {};
          if (product?.status) {
            productUpdateData.status = product.status;
          }
          if (product?.categories) {
            productUpdateData.categories = {
              set: product.categories.map((cat: any) => ({ id: cat.id })),
            };
          }
          if (product?.tags) {
            productUpdateData.tags = {
              set: product.tags.map((tag: any) => ({ id: tag.id })),
            };
          }

          if (Object.keys(productUpdateData).length > 0) {
            await tx.product.update({
              where: { id: product.id },
              data: productUpdateData,
            });
          }

          const allInventories = product.variants.flatMap(
            (v: any) => v.inventory,
          );
          for (const inv of allInventories) {
            if (inv.stock !== undefined) {
              const promise = tx.inventory.update({
                where: { id: inv.id },
                data: { stock: inv.stock },
              });
              inventoryUpdatePromises.push(promise);
            }
          }

          await Promise.all(inventoryUpdatePromises);
        }
      },
      {
        timeout: 15000,
      },
    );

    return NextResponse.json({ message: 'Варианты успешно обновлены' });
  } catch (error) {
    console.error('Ошибка при обновлении вариантов:', error);
    return NextResponse.json(
      // @ts-ignore
      { message: 'Внутренняя ошибка сервера', error: error.message },
      { status: 500 },
    );
  }
}
