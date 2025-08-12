import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/variants
export async function POST(req: NextRequest) {
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

    const created = await prisma.variant.create({
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
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error('Ошибка при создании варианта:', e);
    return new NextResponse('Ошибка на сервере при создании варианта', {
      status: 500,
    });
  }
}
