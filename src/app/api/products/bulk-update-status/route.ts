// Местоположение: src/app/api/products/bulk-update-status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { BulkUpdateStatusSchema } from '@/lib/schemas/api';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role?.name !== 'ADMIN') {
    return new NextResponse(JSON.stringify({ error: 'Доступ запрещен' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();

    // Zod валидация входных данных
    const validatedData = BulkUpdateStatusSchema.parse(body);
    const { productIds, status } = validatedData;

    const updatedCount = await prisma.product.updateMany({
      where: {
        id: {
          in: productIds,
        },
      },
      data: {
        statusId: status.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Успешно обновлено ${updatedCount.count} товаров`,
      count: updatedCount.count,
    });
  } catch (error) {
    console.error('Error updating product statuses:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Ошибка валидации данных',
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 },
    );
  }
}
