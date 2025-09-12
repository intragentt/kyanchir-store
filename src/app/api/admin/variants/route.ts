// Местоположение: src/app/api/admin/variants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createMoySkladProduct } from '@/lib/moysklad-api';

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

    const parentProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { categories: true },
    });

    if (!parentProduct || !parentProduct.categories[0]?.moyskladId) {
      throw new Error(
        'Родительский товар или его категория не найдены/не синхронизированы',
      );
    }

    // --- НАЧАЛО ИЗМЕНЕНИЙ: Логика создания НОВОГО ТОВАРА в МС ---

    // 1. Формируем имя и артикул для НОВОГО ТОВАРА в Моем складе
    // Теперь мы создаем товар с размером по умолчанию, чтобы сразу задать остаток.
    const newProductNameInMoySklad = `${parentProduct.name} (${color}, ONE_SIZE)`;
    const newProductArticleInMoySklad = `${parentProduct.article}-V1-SONESIZE`; // Примерная логика
    const categoryMoySkladId = parentProduct.categories[0].moyskladId;

    // 2. Создаем НОВЫЙ ТОВАР в Моем складе
    const newMoySkladProduct = await createMoySkladProduct(
      newProductNameInMoySklad,
      newProductArticleInMoySklad,
      categoryMoySkladId,
    );

    if (!newMoySkladProduct || !newMoySkladProduct.id) {
      throw new Error('Не удалось создать новый товар в МойСклад');
    }

    // 3. Создаем ВАРИАНТ и РАЗМЕР в нашей БД
    const oneSize = await prisma.size.upsert({
      where: { value: 'ONE_SIZE' },
      update: {},
      create: { value: 'ONE_SIZE' },
    });

    const newVariant = await prisma.productVariant.create({
      data: {
        product: { connect: { id: parentProduct.id } },
        color: color,
        price: 0,
        sizes: {
          create: {
            size: { connect: { id: oneSize.id } },
            stock: 0, // Начальный остаток 0, добавляется позже
            moySkladHref: newMoySkladProduct.meta.href,
            moySkladType: newMoySkladProduct.meta.type,
          },
        },
      },
      include: {
        sizes: true, // Включаем размеры в ответ
      },
    });

    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    return NextResponse.json(newVariant, { status: 201 });
  } catch (error) {
    console.error('Ошибка при создании варианта:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Внутренняя ошибка сервера';
    return new NextResponse(errorMessage, { status: 500 });
  }
}
