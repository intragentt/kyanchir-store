import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/variants/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const variant = await prisma.variant.findUnique({
    where: { id },
    include: {
      product: true,
      images: true,
      inventory: { include: { size: true } },
    },
  });

  if (!variant) {
    return new NextResponse(
      JSON.stringify({ message: `Вариант ${id} не найден` }),
      { status: 404 },
    );
  }
  return NextResponse.json(variant);
}

// PUT /api/variants/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Разделяем поля варианта и возможные правки продукта
    const { name, description, ...v } = body as {
      color?: string;
      images?: { url: string; order?: number }[]; // для upsert ниже не используем; см. заметку
      price?: number | string;
      oldPrice?: number | string | null;
      discountPercentage?: number | string | null;
      isFeatured?: boolean;
      // правки продукта:
      name?: string;
      description?: string;
    };

    const updated = await prisma.variant.update({
      where: { id },
      data: {
        ...(v.color !== undefined && { color: v.color }),
        ...(v.price !== undefined && { price: Number(v.price) }),
        ...(v.oldPrice !== undefined && {
          oldPrice: v.oldPrice === null ? null : Number(v.oldPrice),
        }),
        ...(v.discountPercentage !== undefined && {
          discountPercentage:
            v.discountPercentage === null ? null : Number(v.discountPercentage),
        }),
        ...(v.isFeatured !== undefined && { isFeatured: v.isFeatured }),
        ...(name !== undefined || description !== undefined
          ? {
              product: {
                update: {
                  ...(name !== undefined && { name }),
                  ...(description !== undefined && { description }),
                },
              },
            }
          : {}),
      },
      include: {
        product: true,
        images: true,
        inventory: { include: { size: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error('Ошибка при обновлении варианта:', e);
    return new NextResponse('Ошибка на сервере при обновлении', {
      status: 500,
    });
  }
}

// DELETE /api/variants/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.variant.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error('Ошибка при удалении варианта:', e);
    return new NextResponse('Ошибка на сервере при удалении', { status: 500 });
  }
}
