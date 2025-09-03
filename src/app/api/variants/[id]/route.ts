// Местоположение: src/app/api/variants/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// --- НАЧАЛО ИЗМЕНЕНИЙ: ИСПРАВЛЯЕМ ТИПИЗАЦИЮ И НАЗВАНИЯ МОДЕЛЕЙ ---

// Определяем правильный, надежный тип для context
type RouteContext = {
  params: {
    id: string;
  };
};

// GET /api/variants/[id]
export async function GET(
  req: NextRequest,
  { params }: RouteContext, // Используем правильный тип
) {
  const { id } = params;

  // Меняем .variant на .productVariant и .inventory на .sizes
  const variant = await prisma.productVariant.findUnique({
    where: { id },
    include: {
      product: true,
      sizes: { include: { size: true } }, // ИЗМЕНЕНО
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
  { params }: RouteContext, // Используем правильный тип
) {
  try {
    const { id } = params;
    const body = await req.json();

    // Меняем .variant на .productVariant
    const updated = await prisma.productVariant.update({
      where: { id },
      data: body, // Передаем тело запроса напрямую для обновления
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
  { params }: RouteContext, // Используем правильный тип
) {
  try {
    const { id } = params;
    // Меняем .variant на .productVariant
    await prisma.productVariant.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error('Ошибка при удалении варианта:', e);
    return new NextResponse('Ошибка на сервере при удалении', { status: 500 });
  }
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---
