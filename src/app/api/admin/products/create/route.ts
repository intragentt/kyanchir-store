// Местоположение: src/app/api/admin/products/create/route.ts
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
    const { name, description, categoryId, statusId } = body;
    let { article } = body;

    if (!name || !categoryId || !statusId) {
      return new NextResponse('Отсутствуют обязательные поля', { status: 400 });
    }
    if (!article) {
      article = `KYA-${Date.now()}`;
    }

    // --- НАЧАЛО ИЗМЕНЕНИЙ: Интеграция с МойСклад ---

    // 1. Находим категорию в нашей БД, чтобы получить ее moyskladId
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category || !category.moyskladId) {
      return new NextResponse(
        'Выбранная категория не синхронизирована с МойСклад',
        { status: 400 },
      );
    }

    // 2. Создаем продукт СНАЧАЛА в МойСклад
    const newMoySkladProduct = await createMoySkladProduct(
      name,
      article,
      category.moyskladId,
    );
    if (!newMoySkladProduct || !newMoySkladProduct.id) {
      throw new Error('Не удалось создать продукт в МойСклад');
    }

    // 3. Создаем продукт в нашей БД, сохраняя связь
    const newProduct = await prisma.product.create({
      data: {
        name,
        article,
        description,
        statusId,
        moyskladId: newMoySkladProduct.id, // <-- Сохраняем ID из МойСклад
        categories: {
          connect: { id: categoryId },
        },
      },
    });
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Ошибка при создании продукта:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Внутренняя ошибка сервера';
    return new NextResponse(errorMessage, { status: 500 });
  }
}
