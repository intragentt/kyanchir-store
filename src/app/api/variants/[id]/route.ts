// Местоположение: src/app/api/variants/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// --- НАЧАЛО ИЗМЕНЕНИЙ: ПРИМЕНЯЕМ САМЫЙ НАДЕЖНЫЙ СПОСОБ ТИПИЗАЦИИ ---

// GET /api/variants/[id]
export async function GET(
  req: NextRequest,
  context: { params: { id: string } }, // Принимаем context целиком
) {
  const { id } = context.params; // Извлекаем params внутри

  const variant = await prisma.productVariant.findUnique({
    where: { id },
    include: {
      product: true,
      sizes: { include: { size: true } },
      images: true,
    },
  });

  if (!variant) {
    return NextResponse.json(
      { message: `Вариант ${id} не найден` },
      { status: 404 },
    );
  }
  return NextResponse.json(variant);
}

// PUT /api/variants/[id]
export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }, // Принимаем context целиком
) {
  try {
    const { id } = context.params; // Извлекаем params внутри
    const body = await req.json();

    const updated = await prisma.productVariant.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error('Ошибка при обновлении варианта:', e);
    return new NextResponse('Ошибка на сервере при обновлении', {
      status: 500,
    });
  }
}

// DELETE /api/variants/[id]
export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }, // Принимаем context целиком
) {
  try {
    const { id } = context.params; // Извлекаем params внутри
    await prisma.productVariant.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error('Ошибка при удалении варианта:', e);
    return new NextResponse('Ошибка на сервере при удалении', { status: 500 });
  }
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---
