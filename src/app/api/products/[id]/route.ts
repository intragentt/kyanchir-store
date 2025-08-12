// Местоположение: src/app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/products/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  });

  if (!product) {
    return new NextResponse('Продукт не найден', { status: 404 });
  }
  return NextResponse.json(product);
}

// PUT /api/products/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description, status } = body;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: { name, description, status },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Ошибка при обновлении продукта:', error);
    return new NextResponse('Ошибка на сервере', { status: 500 });
  }
}

// DELETE /api/products/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Ошибка при удалении продукта:', error);
    return new NextResponse('Ошибка на сервере', { status: 500 });
  }
}
