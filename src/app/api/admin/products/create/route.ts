// Местоположение: src/app/api/admin/products/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createMoySkladProduct } from '@/lib/moysklad-api';
import { generateProductSku } from '@/lib/sku-generator'; // <-- 1. Импортируем наш новый генератор

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role.name !== 'ADMIN') {
    return new NextResponse('Неавторизованный доступ', { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description, categoryId, statusId } = body;
    // let { article } = body; // <-- 2. УДАЛЯЕМ старую переменную

    if (!name || !categoryId || !statusId) {
      return new NextResponse('Отсутствуют обязательные поля', { status: 400 });
    }

    // --- НАЧАЛО КЛЮЧЕВЫХ ИЗМЕНЕНИЙ ---

    // 3. Генерируем правильный артикул перед всеми операциями
    const article = await generateProductSku(prisma, categoryId);

    // 4. Находим категорию в нашей БД (теперь только для moyskladId)
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category || !category.moyskladId) {
      return new NextResponse(
        'Выбранная категория не синхронизирована с МойСклад',
        { status: 400 },
      );
    }

    // 5. Создаем продукт СНАЧАЛА в МойСклад с новым, правильным артикулом
    const newMoySkladProduct = await createMoySkladProduct(
      name,
      article, // <-- Передаем сгенерированный артикул
      category.moyskladId,
    );
    if (!newMoySkladProduct || !newMoySkladProduct.id) {
      throw new Error('Не удалось создать продукт в МойСклад');
    }

    // 6. Создаем продукт в нашей БД, сохраняя связь
    const newProduct = await prisma.product.create({
      data: {
        name,
        article, // <-- Сохраняем сгенерированный артикул
        description,
        statusId,
        moyskladId: newMoySkladProduct.id,
        categories: {
          connect: { id: categoryId },
        },
      },
    });
    // --- КОНЕЦ КЛЮЧЕВЫХ ИЗМЕНЕНИЙ ---

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Ошибка при создании продукта:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Внутренняя ошибка сервера';
    return new NextResponse(errorMessage, { status: 500 });
  }
}
