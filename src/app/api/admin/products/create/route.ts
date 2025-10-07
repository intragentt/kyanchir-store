// Местоположение: /src/app/api/admin/products/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createMoySkladProduct } from '@/lib/moysklad-api';
import { generateProductSku } from '@/lib/sku-generator';
import { createSlug, ensureUniqueSlug } from '@/utils/createSlug';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role.name !== 'ADMIN') {
    return new NextResponse('Неавторизованный доступ', { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description, categoryId, statusId } = body;

    if (!name || !categoryId || !statusId) {
      return new NextResponse('Отсутствуют обязательные поля', { status: 400 });
    }

    // --- НАЧАЛО КЛЮЧЕВЫХ ИЗМЕНЕНИЙ ---

    // 1. Генерируем базовый артикул
    const article = await generateProductSku(prisma, categoryId);

    const baseSlug = createSlug(name);
    const slug = await ensureUniqueSlug(baseSlug, async (candidate) => {
      const existing = await prisma.product.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      return Boolean(existing);
    });

    // 2. Находим категорию для ее moyskladId
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category || !category.moyskladId) {
      return new NextResponse(
        'Выбранная категория не синхронизирована с МойСклад',
        { status: 400 },
      );
    }

    // 3. Создаем в МойСклад ОДИН товар, который будет нашим "Основным" вариантом
    const newMoySkladProduct = await createMoySkladProduct(
      name, // Простое имя, без "(Основной)"
      article,
      category.moyskladId,
    );
    if (!newMoySkladProduct || !newMoySkladProduct.id) {
      throw new Error('Не удалось создать продукт в МойСклад');
    }

    // 4. Находим или создаем размер "ONE_SIZE"
    const oneSize = await prisma.size.upsert({
      where: { value: 'ONE_SIZE' },
      update: {},
      create: { value: 'ONE_SIZE' },
    });

    // 5. Создаем ВСЮ СТРУКТУРУ в нашей БД ОДНОЙ ТРАНЗАКЦИЕЙ
    const newProduct = await prisma.product.create({
      data: {
        name,
        slug,
        article,
        description,
        statusId,
        moyskladId: newMoySkladProduct.id,
        categories: {
          connect: { id: categoryId },
        },
        // Вложенное создание варианта и размера
        variants: {
          create: {
            color: 'Основной',
            price: 0,
            moySkladId: newMoySkladProduct.id, // ID из МойСклад
            sizes: {
              create: {
                sizeId: oneSize.id,
                stock: 0, // Начальный остаток 0
                moySkladHref: newMoySkladProduct.meta.href,
                moySkladType: newMoySkladProduct.meta.type,
                article: article, // Базовый артикул для размера ONE_SIZE
              },
            },
          },
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
