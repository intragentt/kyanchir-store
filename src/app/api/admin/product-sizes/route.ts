// Местоположение: /src/app/api/admin/product-sizes/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { generateVariantSku, generateSizeSku } from '@/lib/sku-generator';
import {
  updateMoySkladVariantStock,
  createMoySkladVariant, // <-- 1. Импортируем нашу новую главную функцию
} from '@/lib/moysklad-api';

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

    // 2. Получаем всю информацию о родителях
    const variant = await prisma.productVariant.findUnique({
      where: { id: productVariantId },
      include: { product: { include: { variants: true } } },
    });
    const size = await prisma.size.findUnique({ where: { id: sizeId } });

    if (!variant || !variant.product.article || !size || !variant.moySkladId) {
      throw new Error(
        'Не найден вариант, родительский товар, размер или ID МойСклад',
      );
    }

    // 3. Генерируем финальный артикул для новой модификации
    const variantIndex = variant.product.variants.findIndex(
      (v) => v.id === variant.id,
    );
    const variantBaseArticle = generateVariantSku(
      variant.product.article,
      variantIndex,
    );
    const finalSizeArticle = generateSizeSku(variantBaseArticle, size.value);

    // 4. Создаем настоящую МОДИФИКАЦИЮ в МойСклад
    const newMoySkladModification = await createMoySkladVariant(
      variant.moySkladId, // <-- ID родительского ТОВАРА в МойСклад
      finalSizeArticle, // <-- Новый, уникальный артикул
      size.value, // <-- Значение размера, например "S"
    );

    if (!newMoySkladModification) {
      throw new Error('Не удалось создать модификацию в МойСклад');
    }

    // 5. Если нужно, устанавливаем начальный остаток для НОВОЙ модификации
    if (stock > 0) {
      await updateMoySkladVariantStock(
        newMoySkladModification.meta.href,
        newMoySkladModification.meta.type,
        stock,
        0,
      );
    }

    // 6. Выполняем "уборку" и сохранение в нашей БД в одной транзакции
    const [, newProductSize] = await prisma.$transaction([
      // Удаляем временный ONE_SIZE, если он был
      prisma.productSize.deleteMany({
        where: { productVariantId: variant.id, size: { value: 'ONE_SIZE' } },
      }),
      // Создаем новую, правильную запись о размере
      prisma.productSize.create({
        data: {
          productVariantId: variant.id,
          sizeId: size.id,
          stock: stock,
          article: finalSizeArticle,
          // Сохраняем Href и Type от НОВОЙ модификации
          moySkladHref: newMoySkladModification.meta.href,
          moySkladType: newMoySkladModification.meta.type,
        },
      }),
    ]);

    return NextResponse.json(newProductSize, { status: 201 });
  } catch (error) {
    console.error('Ошибка при добавлении размера:', error);
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return new NextResponse(
        'Такой размер для этого варианта уже существует',
        { status: 409 },
      );
    }
    const errorMessage =
      error instanceof Error ? error.message : 'Внутренняя ошибка сервера';
    return new NextResponse(errorMessage, { status: 500 });
  }
}
