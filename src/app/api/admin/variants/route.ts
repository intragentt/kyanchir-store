// Местоположение: src/app/api/admin/variants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createMoySkladVariant } from '@/lib/moysklad-api';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role.name !== 'ADMIN') {
    return new NextResponse('Неавторизованный доступ', { status: 401 });
  }

  try {
    const body = await req.json();
    const { productId, color } = body;

    if (!productId || !color) {
      return new NextResponse('Отсутствуют ID товара или цвет', {
        status: 400,
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.moyskladId || !product.article) {
      throw new Error('Родительский товар не найден или не синхронизирован');
    }

    const variantArticle = `${product.article}-${color.toUpperCase()}`;

    // 1. Создаем модификацию в МойСклад
    const newMoySkladVariant = await createMoySkladVariant(
      product.moyskladId,
      color,
      variantArticle,
    );
    if (!newMoySkladVariant || !newMoySkladVariant.id) {
      throw new Error('Не удалось создать модификацию в МойСклад');
    }

    // 2. Создаем вариант в нашей БД
    const newVariant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        color: color,
        price: 0, // Цена по умолчанию, ее можно будет изменить позже
        moySkladId: newMoySkladVariant.id,
      },
    });

    return NextResponse.json(newVariant, { status: 201 });
  } catch (error) {
    console.error('Ошибка при создании варианта:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Внутренняя ошибка сервера';
    return new NextResponse(errorMessage, { status: 500 });
  }
}
