// Местоположение: src/app/api/products/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET-хендлер для получения ВСЕХ продуктов, включая их варианты
 */
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        variants: {
          orderBy: { createdAt: 'asc' },
        },
        categories: true,
        attributes: true,
      },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error('Ошибка при получении продуктов:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * POST-хендлер для СОЗДАНИЯ нового базового ПРОДУКТА.
 * Создает только "оболочку" товара.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, status } = body;

    if (!name) {
      return new NextResponse('Название продукта обязательно', { status: 400 });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        status, // DRAFT, PUBLISHED, etc.
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Ошибка при создании продукта:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
