// Местоположение: src/app/api/admin/product-sizes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { updateMoySkladVariantStock } from '@/lib/moysklad-api';

const MOYSKLAD_API_URL = 'https://api.moysklad.ru/api/remap/1.2';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role.name !== 'ADMIN') {
    return new NextResponse('Неавторизованный доступ', { status: 401 });
  }

  try {
    const body = await req.json();
    const { productVariantId, sizeId, stock } = body;

    if (!productVariantId || !sizeId || stock === undefined || stock < 0) {
      return new NextResponse('Некорректные данные запроса', { status: 400 });
    }

    // 1. Находим вариант в нашей БД, чтобы получить его moySkladId
    const variant = await prisma.productVariant.findUnique({
      where: { id: productVariantId },
    });
    if (!variant || !variant.moySkladId) {
      throw new Error('Вариант не найден или не синхронизирован с МойСклад');
    }

    // 2. Создаем или обновляем запись о размере в нашей БД
    // `upsert` - удобный метод: создает если нет, обновляет если есть.
    const productSize = await prisma.productSize.upsert({
      where: {
        productVariantId_sizeId: {
          productVariantId,
          sizeId,
        },
      },
      update: {
        stock: {
          increment: stock, // Добавляем к существующему остатку
        },
      },
      create: {
        productVariantId,
        sizeId,
        stock,
      },
    });

    // 3. Синхронизируем остаток с МойСклад
    // Так как для МС наш вариант - это отдельный товар, его тип 'product'
    const moySkladHref = `${MOYSKLAD_API_URL}/entity/product/${variant.moySkladId}`;
    const oldStock = productSize.stock - stock; // Вычисляем старый остаток

    await updateMoySkladVariantStock(
      moySkladHref,
      'product', // Важно: для МС это товар
      productSize.stock, // Новый общий остаток
      oldStock, // Старый остаток
    );

    return NextResponse.json(productSize, { status: 201 });
  } catch (error) {
    console.error('Ошибка при добавлении размера:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Внутренняя ошибка сервера';
    return new NextResponse(errorMessage, { status: 500 });
  }
}
