// Местоположение: /src/app/api/admin/product-sizes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
  updateMoySkladPrice,
  updateMoySkladVariantStock,
} from '@/lib/moysklad-api';

function getUUIDFromHref(href: string): string {
  const pathPart = href.split('/').pop() || '';
  return pathPart.split('?')[0];
}

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

    const productSize = await prisma.productSize.findUnique({
      where: { id: productSizeId },
    });

    if (!productSize || !productSize.moySkladHref) {
      throw new Error('Запись о размере или ее связь с МойСклад не найдена.');
    }

    // --- НАЧАЛО ИЗМЕНЕНИЙ: Берем ID напрямую из ProductSize ---
    const moySkladProductId = getUUIDFromHref(productSize.moySkladHref);
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

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
      const oldStock = productSize.stock;

      // Используем полный Href, который ожидает функция
      await updateMoySkladVariantStock(
        productSize.moySkladHref,
        productSize.moySkladType,
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
