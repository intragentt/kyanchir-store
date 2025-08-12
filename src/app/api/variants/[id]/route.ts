// Местоположение: src/app/api/products/[id]/route.ts
// ПЕРЕИМЕНОВАТЬ ПАПКУ: Этот файл теперь должен лежать в /api/variants/[id]/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET-хендлер для получения ОДНОГО ВАРИАНТА по его ID (артикулу)
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }, // id здесь - это артикул варианта
) {
  try {
    const { id } = params;
    const variant = await prisma.productVariant.findUnique({
      where: { id },
      include: {
        product: true, // Включаем информацию о родительском продукте
        inventory: {
          // Включаем информацию об остатках
          include: {
            size: true, // ... и о размерах
          },
        },
      },
    });

    if (!variant) {
      return new NextResponse(
        JSON.stringify({ message: `Вариант с артикулом ${id} не найден` }),
        { status: 404 },
      );
    }

    return NextResponse.json(variant);
  } catch (error) {
    console.error(`Ошибка при получении варианта ${params.id}:`, error);
    return new NextResponse(JSON.stringify({ message: 'Ошибка на сервере' }), {
      status: 500,
    });
  }
}

/**
 * PUT-хендлер для ОБНОВЛЕНИЯ ВАРИАНТА по его ID (артикулу)
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Отделяем данные для продукта и для варианта
    const { name, description, ...variantData } = body;

    const updatedVariant = await prisma.productVariant.update({
      where: { id },
      data: {
        price: Number(variantData.price),
        oldPrice: variantData.oldPrice ? Number(variantData.oldPrice) : null,
        images: variantData.images,
        color: variantData.color,
        isFeatured: variantData.isFeatured,
        discountPercentage: variantData.discountPercentage
          ? Number(variantData.discountPercentage)
          : null,
        // Обновляем также и родительский продукт, если пришли его данные
        product: {
          update: {
            name: name,
            description: description,
          },
        },
      },
    });

    return NextResponse.json(updatedVariant);
  } catch (error) {
    console.error(`Ошибка при обновлении варианта ${params.id}:`, error);
    return new NextResponse(
      JSON.stringify({ message: 'Ошибка на сервере при обновлении' }),
      { status: 500 },
    );
  }
}

/**
 * DELETE-хендлер для УДАЛЕНИЯ ВАРИАНТА по его ID (артикулу)
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    await prisma.productVariant.delete({
      where: { id },
    });

    // В будущем можно добавить логику: если это был последний вариант, удалить и сам продукт.

    return new NextResponse(null, { status: 204 }); // Успешное удаление
  } catch (error) {
    console.error(`Ошибка при удалении варианта ${params.id}:`, error);
    return new NextResponse(
      JSON.stringify({ message: 'Ошибка на сервере при удалении' }),
      { status: 500 },
    );
  }
}
