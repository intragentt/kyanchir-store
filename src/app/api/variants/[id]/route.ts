// src/app/api/variants/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/variants/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const variant = await prisma.productVariant.findUnique({
    where: { id },
    include: {
      product: true,
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

    const { name, description, ...variantData } = body;

    const updated = await prisma.productVariant.update({
      where: { id },
      data: {
        ...(variantData.color !== undefined && { color: variantData.color }),
        ...(variantData.images !== undefined && { images: variantData.images }),
        ...(variantData.price !== undefined && {
          price: Number(variantData.price),
        }),
        ...(variantData.oldPrice !== undefined && {
          oldPrice:
            variantData.oldPrice === null ? null : Number(variantData.oldPrice),
        }),
        ...(variantData.discountPercentage !== undefined && {
          discountPercentage:
            variantData.discountPercentage === null
              ? null
              : Number(variantData.discountPercentage),
        }),
        ...(variantData.isFeatured !== undefined && {
          isFeatured: variantData.isFeatured,
        }),
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
    await prisma.productVariant.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error('Ошибка при удалении варианта:', e);
    return new NextResponse('Ошибка на сервере при удалении', { status: 500 });
  }
}
