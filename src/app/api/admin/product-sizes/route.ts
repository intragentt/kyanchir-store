// Местоположение: /src/app/api/admin/product-sizes/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { generateVariantSku, generateSizeSku } from '@/lib/sku-generator';
import { updateMoySkladVariantStock } from '@/lib/moysklad-api';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role.name !== 'ADMIN') {
    return new NextResponse('Неавторизованный доступ', { status: 401 });
  }

  try {
    const body = await req.json();
    const { productVariantId, sizeId, initialStock } = body;

    if (!productVariantId || !sizeId || initialStock === undefined) {
      return new NextResponse('Отсутствуют обязательные поля', { status: 400 });
    }

    const stock = Number(initialStock);
    if (isNaN(stock) || stock < 0) {
      return new NextResponse('Некорректное значение остатка', {
        status: 400,
      });
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: productVariantId },
      include: {
        product: {
          include: {
            variants: true,
          },
        },
        sizes: true,
      },
    });

    const size = await prisma.size.findUnique({ where: { id: sizeId } });

    if (!variant || !variant.product.article || !size) {
      throw new Error('Не найден вариант, родительский товар или размер');
    }
    if (!variant.sizes[0]?.moySkladHref || !variant.sizes[0]?.moySkladType) {
      throw new Error('Вариант не синхронизирован с МойСклад');
    }

    const { moySkladHref, moySkladType } = variant.sizes[0];

    const variantIndex = variant.product.variants.findIndex(
      (v) => v.id === variant.id,
    );
    const variantArticle = generateVariantSku(
      variant.product.article,
      variantIndex,
    );
    const sizeArticle = generateSizeSku(variantArticle, size.value);

    if (stock > 0) {
      // --- НАЧАЛО ИЗМЕНЕНИЯ: Передаем аргументы по отдельности, а не объектом ---
      await updateMoySkladVariantStock(
        moySkladHref,
        moySkladType,
        stock, // newStock
        0, // oldStock
      );
      // --- КОНЕЦ ИЗМЕНЕНИЯ ---
    }

    const newProductSize = await prisma.productSize.create({
      data: {
        productVariantId: variant.id,
        sizeId: size.id,
        stock: stock,
        article: sizeArticle,
        moySkladHref: moySkladHref,
        moySkladType: moySkladType,
      },
    });

    return NextResponse.json(newProductSize, { status: 201 });
  } catch (error) {
    console.error('Ошибка при добавлении размера:', error);
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return new NextResponse(
        'Такой размер для этого варианта уже существует',
        {
          status: 409,
        },
      );
    }
    const errorMessage =
      error instanceof Error ? error.message : 'Внутренняя ошибка сервера';
    return new NextResponse(errorMessage, { status: 500 });
  }
}
