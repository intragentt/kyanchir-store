// Местоположение: src/app/api/products/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Оставляем ТОЛЬКО GET-запрос в его самой простой форме для диагностики
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    // Простой запрос, чтобы убедиться, что база данных доступна
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return new NextResponse(JSON.stringify({ error: 'Продукт не найден' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('[API GET PRODUCT ERROR]', error);
    return new NextResponse(
      JSON.stringify({ error: 'Внутренняя ошибка сервера' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

/*
// --- ВРЕМЕННО ЗАКОММЕНТИРОВАНО ДЛЯ ДИАГНОСТИКИ ---

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  // ...
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  // ...
}
*/
