// Местоположение: /src/app/api/admin/products/update-size-price/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { updateMoySkladPrice } from '@/lib/moysklad-api';

interface RequestBody {
  productSizeId: string;
  newPrice: number | null;
  newOldPrice: number | null;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role.name !== 'ADMIN') {
    return new NextResponse('Неавторизован', { status: 401 });
  }

  try {
    const body = (await req.json()) as RequestBody;
    const { productSizeId, newPrice, newOldPrice } = body;

    if (!productSizeId) {
      return new NextResponse('Отсутствует ID размера для обновления', {
        status: 400,
      });
    }

    // --- НАЧАЛО ИЗМЕНЕНИЙ: Получаем актуальный moySkladId ---

    // 1. Находим ProductSize и его родительский ProductVariant в нашей БД
    const sizeWithVariant = await prisma.productSize.findUnique({
      where: { id: productSizeId },
      include: {
        productVariant: true,
      },
    });

    if (!sizeWithVariant?.productVariant?.moySkladId) {
      throw new Error(
        'Не удалось найти связанный товар из МойСклад для этого размера.',
      );
    }

    // 2. Извлекаем ID товара в МойСклад из родительского варианта
    const moySkladProductId = sizeWithVariant.productVariant.moySkladId;

    // 3. Вызываем API-мост с правильным ID товара
    await updateMoySkladPrice(moySkladProductId, newPrice, newOldPrice);

    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    // 4. Синхронизация с нашей БД (остается без изменений)
    await prisma.productSize.update({
      where: { id: productSizeId },
      data: {
        price: newPrice,
        oldPrice: newOldPrice,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Ошибка при обновлении цены:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Внутренняя ошибка сервера';
    return new NextResponse(errorMessage, { status: 500 });
  }
}
