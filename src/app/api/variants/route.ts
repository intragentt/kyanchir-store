// Местоположение: src/app/api/variants/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST-хендлер для СОЗДАНИЯ нового ВАРИАНТА для существующего продукта
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, color, images, price, oldPrice, discountPercentage } =
      body;

    // Проверка, что обязательные поля переданы
    if (!productId || !price || !color) {
      return new NextResponse('Недостаточно данных для создания варианта', {
        status: 400,
      });
    }

    const newVariant = await prisma.productVariant.create({
      data: {
        productId,
        color,
        images,
        price: Number(price),
        oldPrice: oldPrice ? Number(oldPrice) : null,
        discountPercentage: discountPercentage
          ? Number(discountPercentage)
          : null,
      },
    });

    return NextResponse.json(newVariant, { status: 201 });
  } catch (error) {
    console.error('Ошибка при создании варианта:', error);
    return new NextResponse('Ошибка на сервере при создании варианта', {
      status: 500,
    });
  }
}
