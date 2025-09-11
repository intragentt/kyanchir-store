// Местоположение: src/app/api/admin/variants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
// --- ИЗМЕНЕНИЕ: Используем функцию создания ТОВАРА, а не варианта ---
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

    // Находим родительский продукт в нашей БД, чтобы получить его данные
    const parentProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { categories: true },
    });

    if (!parentProduct || !parentProduct.categories[0]?.moyskladId) {
      throw new Error(
        'Родительский товар или его категория не найдены/не синхронизированы',
      );
    }

    // --- НОВАЯ ЛОГИКА ---
    // 1. Формируем имя и артикул для НОВОГО ТОВАРА в Моем складе
    const newProductNameInMoySklad = `${parentProduct.name} (${color})`;
    const newProductArticleInMoySklad = `${
      parentProduct.article
    }-${color.toUpperCase()}`;
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

    // 3. Создаем ВАРИАНТ в нашей БД, связывая его с ID нового товара из МойСклад
    const newVariant = await prisma.productVariant.create({
      data: {
        productId: parentProduct.id,
        color: color,
        price: 0, // Цена по умолчанию
        moySkladId: newMoySkladProduct.id, // <-- ID нового ТОВАРА
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
