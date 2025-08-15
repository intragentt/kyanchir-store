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

    // Увеличиваем время ожидания для этой конкретной операции
    await prisma.$transaction(
      async (tx) => {
        for (const variant of variants) {
          // --- НАЧАЛО ОПТИМИЗАЦИИ ---

          const product = variant.product;
          const inventoryUpdatePromises = [];

          // 1. Обновляем сам вариант (цены, бонусы) - это остается как есть
          await tx.variant.update({
            where: { id: variant.id },
            data: {
              price: variant.price,
              oldPrice: variant.oldPrice,
              bonusPoints: variant.bonusPoints,
            },
          });

          // 2. Готовим ОДИН большой объект для обновления продукта
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

          // Если есть что обновлять в продукте - обновляем за один раз
          if (Object.keys(productUpdateData).length > 0) {
            await tx.product.update({
              where: { id: product.id },
              data: productUpdateData,
            });
          }

          // 3. Собираем все обещания по обновлению остатков
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

          // Выполняем все обновления остатков параллельно
          await Promise.all(inventoryUpdatePromises);

          // --- КОНЕЦ ОПТИМИЗАЦИИ ---
        }
      },
      {
        timeout: 15000, // Увеличиваем тайм-аут до 15 секунд на всякий случай
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
