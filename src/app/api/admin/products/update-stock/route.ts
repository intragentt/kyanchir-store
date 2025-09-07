// /src/app/api/admin/products/update-stock/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { updateMoySkladVariantStock } from '@/lib/moysklad-api';

interface RequestBody {
  moySkladHref: string;
  moySkladType: string;
  newStock: number;
  productSizeId: string;
}
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role.name !== 'ADMIN') {
    return new NextResponse('Неавторизован', { status: 401 });
  }
  try {
    const body = (await req.json()) as RequestBody;
    const { moySkladHref, moySkladType, newStock, productSizeId } = body;
    if (
      !moySkladHref ||
      !moySkladType ||
      newStock === undefined ||
      !productSizeId
    ) {
      return new NextResponse('Отсутствуют необходимые данные', {
        status: 400,
      });
    }
    if (typeof newStock !== 'number' || newStock < 0) {
      return new NextResponse('Некорректное значение остатка', { status: 400 });
    }
    await updateMoySkladVariantStock(moySkladHref, moySkladType, newStock);
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
