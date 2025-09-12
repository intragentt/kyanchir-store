// Местоположение: /src/app/api/admin/product-sizes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { updateMoySkladVariantStock } from '@/lib/moysklad-api';

const MOYSKLAD_API_URL = 'https://api.moysklad.ru/api/remap/1.2';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role.name !== 'ADMIN') {
    return new NextResponse('Неавторизован', { status: 401 });
  }

  try {
    const body = await req.json();
    const { productVariantId, sizeId, stock } = body;

    if (!productVariantId || !sizeId || stock === undefined || stock < 0) {
      return new NextResponse('Некорректные данные запроса', { status: 400 });
    }

    // --- НАЧАЛО ИЗМЕНЕНИЙ: Удаляем "ONE_SIZE" при добавлении реального размера ---
    const oneSizeToDelete = await prisma.productSize.findFirst({
      where: {
        productVariantId: productVariantId,
        size: {
          value: 'ONE_SIZE',
        },
        stock: 0,
      },
    });

    if (oneSizeToDelete) {
      await prisma.productSize.delete({
        where: { id: oneSizeToDelete.id },
      });
      console.log(
        `[API] Автоматически удален ONE_SIZE для варианта ${productVariantId}`,
      );
    }
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    const variant = await prisma.productVariant.findUnique({
      where: { id: productVariantId },
    });
    if (!variant || !variant.moySkladId) {
      throw new Error('Вариант не найден или не синхронизирован с МойСклад');
    }

    const productSize = await prisma.productSize.upsert({
      where: {
        productVariantId_sizeId: {
          productVariantId,
          sizeId,
        },
      },
      update: {
        stock: {
          increment: stock,
        },
      },
      create: {
        productVariantId,
        sizeId,
        stock,
        moySkladType: 'product', // Предполагаем, что всегда товар
        moySkladHref: `${MOYSKLAD_API_URL}/entity/product/${variant.moySkladId}`, // Формируем Href
      },
    });

    const moySkladHref = `${MOYSKLAD_API_URL}/entity/product/${variant.moySkladId}`;
    const oldStock = productSize.stock - stock;

    await updateMoySkladVariantStock(
      moySkladHref,
      'product',
      productSize.stock,
      oldStock,
    );

    return NextResponse.json(productSize, { status: 201 });
  } catch (error) {
    console.error('Ошибка при добавлении размера:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Внутренняя ошибка сервера';
    return new NextResponse(errorMessage, { status: 500 });
  }
}
