// Местоположение: src/app/api/products/[id]/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET-хендлер остается без изменений, он нужен для получения данных
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { variants: true },
  });
  if (!product) {
    return new NextResponse('Продукт не найден', { status: 404 });
  }
  return NextResponse.json(product);
}

// VVV--- НАПОЛНЯЕМ ЛОГИКОЙ PUT-ХЕНДЛЕР ---VVV
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const id = params.id;
    const body = await request.json();

    const { name, description, status } = body;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        status,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error(`Ошибка при обновлении продукта ${params.id}:`, error);
    return new NextResponse('Ошибка на сервере', { status: 500 });
  }
}

// DELETE-хендлер пока можно оставить пустым, т.к. мы удаляем варианты, а не продукты целиком
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const id = params.id;
    // Удаляем продукт, а Prisma по onDelete: Cascade удалит все связанные варианты
    await prisma.product.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Ошибка при удалении продукта ${params.id}:`, error);
    return new NextResponse('Ошибка на сервере', { status: 500 });
  }
}
