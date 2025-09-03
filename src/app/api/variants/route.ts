import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/variants
export async function POST(req: NextRequest) {
  // --- НАЧАЛО ИЗМЕНЕНИЙ (1/2): Добавляем защиту ---
  const session = await getServerSession(authOptions);
  if (!session || session.user.role?.name !== 'ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  // --- КОНЕЦ ИЗМЕНЕНИЙ (1/2) ---

  try {
    const body = await req.json();
    const { productId, color, price, oldPrice, discountPercentage, images } =
      body;

    if (!productId || price == null) {
      return NextResponse.json(
        { message: 'productId и price обязательны' },
        { status: 400 },
      );
    }

    // --- НАЧАЛО ИЗМЕНЕНИЙ (2/2): Исправляем имя модели ---
    const created = await prisma.productVariant.create({
      // --- КОНЕЦ ИЗМЕНЕНИЙ (2/2) ---
      data: {
        product: { connect: { id: productId } },
        color: color ?? null,
        price: Number(price),
        oldPrice: oldPrice == null ? null : Number(oldPrice),
        discountPercentage:
          discountPercentage == null ? null : Number(discountPercentage),
        // изображения — это отдельная таблица Image:
        ...(Array.isArray(images) && images.length
          ? {
              images: {
                create: images.map((url: string, idx: number) => ({
                  url,
                  order: idx + 1,
                })),
              },
            }
          : {}),
      },
      include: {
        images: true, // Возвращаем созданный вариант вместе с изображениями
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error('Ошибка при создании варианта:', e);
    return new NextResponse('Ошибка на сервере при создании варианта', {
      status: 500,
    });
  }
}
