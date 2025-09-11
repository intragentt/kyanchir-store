// Местоположение: src/app/api/admin/products/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  // 1. Проверяем права администратора
  // --- ИСПРАВЛЕНИЕ: Проверяем свойство 'name' в объекте 'role' ---
  if (!session || session.user.role.name !== 'ADMIN') {
    return new NextResponse('Неавторизованный доступ', { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description, categoryId, statusId } = body;
    let { article } = body;

    // 2. Проверяем обязательные поля
    if (!name || !categoryId || !statusId) {
      return new NextResponse('Отсутствуют обязательные поля', {
        status: 400,
      });
    }

    // 3. Генерируем артикул, если он не предоставлен
    if (!article) {
      article = `KYA-${Date.now()}`;
    }

    // 4. Создаем продукт в базе данных
    const newProduct = await prisma.product.create({
      data: {
        name,
        article,
        description,
        statusId,
        categories: {
          connect: { id: categoryId },
        },
      },
    });

    // 5. Возвращаем успешный ответ с созданным продуктом
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Ошибка при создании продукта:', error);
    return new NextResponse('Внутренняя ошибка сервера', { status: 500 });
  }
}
