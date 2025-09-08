// Местоположение: /src/app/api/admin/products/update-size-price/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { updateMoySkladPrice } from '@/lib/moysklad-api';

// Определяем, какие данные мы ожидаем получить
interface RequestBody {
  moySkladHref: string;
  productSizeId: string;
  newPrice: number | null;
  newOldPrice: number | null;
}

export async function POST(req: Request) {
  // 1. Безопасность
  const session = await getServerSession(authOptions);
  if (!session || session.user.role.name !== 'ADMIN') {
    return new NextResponse('Неавторизован', { status: 401 });
  }

  try {
    const body = (await req.json()) as RequestBody;
    const { moySkladHref, productSizeId, newPrice, newOldPrice } = body;

    // 2. Валидация
    if (!moySkladHref || !productSizeId) {
      return new NextResponse('Отсутствуют ID для обновления', {
        status: 400,
      });
    }

    // 3. Связь с "МойСклад"
    await updateMoySkladPrice(moySkladHref, newPrice, newOldPrice);

    // 4. Синхронизация с нашей БД
    await prisma.productSize.update({
      where: { id: productSizeId },
      data: {
        price: newPrice,
        oldPrice: newOldPrice,
      },
    });

    // 5. Успешный ответ
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Ошибка при обновлении цены:', error);
    return new NextResponse('Внутренняя ошибка сервера', { status: 500 });
  }
}
