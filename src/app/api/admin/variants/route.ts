// Местоположение: src/app/api/admin/variants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createMoySkladProduct } from '@/lib/moysklad-api';
import { generateVariantSku } from '@/lib/sku-generator'; // <-- 1. Импортируем наш новый генератор

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

    // --- НАЧАЛО КЛЮЧЕВЫХ ИЗМЕНЕНИЙ ---

    // 2. Находим родительский товар и сразу включаем его варианты для подсчета
    const parentProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { categories: true, variants: true }, // <-- Включаем variants
    });

    if (!parentProduct || !parentProduct.article) {
      throw new Error('Родительский товар или его артикул не найдены');
    }
    if (!parentProduct.categories[0]?.moyskladId) {
      throw new Error('Категория родительского товара не синхронизирована');
    }

    // 3. Генерируем имя и артикул для НОВОГО ТОВАРА в Моем Складе
    const newProductNameInMoySklad = `${parentProduct.name} (${color})`; // <-- Убираем лишний размер
    const newProductArticleInMoySklad = generateVariantSku(
      parentProduct.article,
      parentProduct.variants.length, // <-- Передаем кол-во существующих вариантов
    );
    const categoryMoySkladId = parentProduct.categories[0].moyskladId;

    // 4. Создаем НОВЫЙ ТОВАР в Моем Складе
    const newMoySkladProduct = await createMoySkladProduct(
      newProductNameInMoySklad,
      newProductArticleInMoySklad,
      categoryMoySkladId,
    );

    if (!newMoySkladProduct || !newMoySkladProduct.id) {
      throw new Error('Не удалось создать новый товар в МойСклад');
    }

    // 5. Создаем ВАРИАНТ и РАЗМЕР в нашей БД
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
        moySkladId: newMoySkladProduct.id,
        sizes: {
          create: {
            size: { connect: { id: oneSize.id } },
            stock: 0,
            moySkladHref: newMoySkladProduct.meta.href,
            moySkladType: newMoySkladProduct.meta.type,
          },
        },
      },
      include: {
        sizes: true,
      },
    });

    // --- КОНЕЦ КЛЮЧЕВЫХ ИЗМЕНЕНИЙ ---

    return NextResponse.json(newVariant, { status: 201 });
  } catch (error) {
    console.error('Ошибка при создании варианта:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Внутренняя ошибка сервера';
    return new NextResponse(errorMessage, { status: 500 });
  }
}
