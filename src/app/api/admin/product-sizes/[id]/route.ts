// Местоположение: /src/app/api/admin/product-sizes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
  updateMoySkladPrice,
  updateMoySkladVariantStock,
} from '@/lib/moysklad-api';

const MOYSKLAD_API_URL = 'https://api.moysklad.ru/api/remap/1.2';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role.name !== 'ADMIN') {
    return new NextResponse('Неавторизован', { status: 401 });
  }

  try {
    const productSizeId = params.id;
    const body = await req.json();

    const sizeWithVariant = await prisma.productSize.findUnique({
      where: { id: productSizeId },
      include: { productVariant: true },
    });

    if (!sizeWithVariant?.productVariant?.moySkladId) {
      throw new Error('Связанный товар МойСклад не найден.');
    }
    const moySkladProductId = sizeWithVariant.productVariant.moySkladId;

    // --- Логика обновления ЦЕНЫ ---
    if (body.price !== undefined || body.oldPrice !== undefined) {
      const newPrice = body.price;
      const newOldPrice = body.oldPrice;

      await updateMoySkladPrice(moySkladProductId, newPrice, newOldPrice);
      await prisma.productSize.update({
        where: { id: productSizeId },
        data: { price: newPrice, oldPrice: newOldPrice },
      });
    }

    // --- Логика обновления ОСТАТКА ---
    if (body.stock !== undefined) {
      const newStock = Number(body.stock);
      const oldStock = sizeWithVariant.stock;

      const moySkladHref = `${MOYSKLAD_API_URL}/entity/product/${moySkladProductId}`;
      await updateMoySkladVariantStock(
        moySkladHref,
        'product',
        newStock,
        oldStock,
      );
      await prisma.productSize.update({
        where: { id: productSizeId },
        data: { stock: newStock },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Ошибка при обновлении размера:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Внутренняя ошибка сервера';
    return new NextResponse(errorMessage, { status: 500 });
  }
}
