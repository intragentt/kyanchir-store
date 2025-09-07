// Местоположение: /src/app/api/admin/products/update-stock/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { updateMoySkladVariantStock } from '@/lib/moysklad-api';

interface RequestBody {
  variantMoySkladId: string;
  newStock: number;
  productSizeId: string;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Исправляем проверку роли пользователя ---
  // Сравниваем не весь объект, а его свойство `name`
  if (!session || session.user.role.name !== 'admin') {
    return new NextResponse('Неавторизован', { status: 401 });
  }
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  try {
    const body = (await req.json()) as RequestBody;
    const { variantMoySkladId, newStock, productSizeId } = body;

    if (!variantMoySkladId || newStock === undefined || !productSizeId) {
      return new NextResponse('Отсутствуют необходимые данные', {
        status: 400,
      });
    }

    if (typeof newStock !== 'number' || newStock < 0) {
      return new NextResponse('Некорректное значение остатка', {
        status: 400,
      });
    }

    await updateMoySkladVariantStock(variantMoySkladId, newStock);

    await prisma.productSize.update({
      where: { id: productSizeId },
      data: { stock: newStock },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Ошибка при обновлении остатков:', error);
    return new NextResponse('Внутренняя ошибка сервера', { status: 500 });
  }
}
