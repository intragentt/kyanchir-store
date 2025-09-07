// Местоположение: /src/app/api/admin/products/update-stock/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { updateMoySkladVariantStock } from '@/lib/moysklad-api';

// --- НАЧАЛО ИЗМЕНЕНИЙ: Обновляем интерфейс ---
interface RequestBody {
  variantMoySkladHref: string; // Принимаем Href
  newStock: number;
  productSizeId: string;
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role.name !== 'ADMIN') {
    return new NextResponse('Неавторизован', { status: 401 });
  }

  try {
    const body = (await req.json()) as RequestBody;
    // --- НАЧАЛО ИЗМЕНЕНИЙ: Работаем с Href ---
    const { variantMoySkladHref, newStock, productSizeId } = body;

    if (!variantMoySkladHref || newStock === undefined || !productSizeId) {
      return new NextResponse('Отсутствуют необходимые данные', {
        status: 400,
      });
    }
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    if (typeof newStock !== 'number' || newStock < 0) {
      return new NextResponse('Некорректное значение остатка', {
        status: 400,
      });
    }

    // --- НАЧАЛО ИЗМЕНЕНИЙ: Передаем Href в API-мост ---
    await updateMoySkladVariantStock(variantMoySkladHref, newStock);
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

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
