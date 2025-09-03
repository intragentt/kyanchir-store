// Местоположение: src/app/api/products/bulk-update-status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Prisma } from '@prisma/client';

// --- НАЧАЛО ИЗМЕНЕНИЙ (1/3): Исправляем определение типа ---
// Теперь TypeScript понимает, что 'status' - это объект со своими полями (id, name и т.д.)
type ProductStatus = Prisma.ProductGetPayload<{
  include: { status: true };
}>['status'];
// --- КОНЕЦ ИЗМЕНЕНИЙ (1/3) ---

interface RequestBody {
  productIds: string[];
  status: ProductStatus; // status теперь это объект, например { id: "...", name: "..." }
}

export async function POST(request: NextRequest) {
  // --- НАЧАЛО ИЗМЕНЕНИЙ (2/3): Добавляем защиту эндпоинта ---
  const session = await getServerSession(authOptions);

  // Доступ разрешен только администраторам
  if (!session || session.user.role?.name !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  // --- КОНЕЦ ИЗМЕНЕНИЙ (2/3) ---

  try {
    const body: RequestBody = await request.json();
    const { productIds, status } = body;

    // Проверяем, что ID статуса передан
    if (!productIds || !status || !status.id || productIds.length === 0) {
      return new NextResponse('Missing productIds or a valid status object', {
        status: 400,
      });
    }

    // --- НАЧАЛО ИЗМЕНЕНИЙ (3/3): Исправляем логику обновления Prisma ---
    // Мы обновляем поле-ключ 'statusId', а не всю связь 'status'
    const updatedCount = await prisma.product.updateMany({
      where: {
        id: {
          in: productIds,
        },
      },
      data: {
        statusId: status.id, // <-- ПРАВИЛЬНЫЙ СПОСОБ
      },
    });
    // --- КОНЕЦ ИЗМЕНЕНИЙ (3/3) ---

    return NextResponse.json({
      message: `Successfully updated ${updatedCount.count} products.`,
      count: updatedCount.count,
    });
  } catch (error) {
    console.error('Error updating product statuses:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
