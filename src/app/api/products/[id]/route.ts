// Местоположение: src/app/api/products/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { UpdateProductPayload } from '@/lib/types';
import { Prisma } from '@prisma/client';

// ... GET и DELETE без изменений ...
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  });
  if (!product) {
    return new NextResponse('Продукт не найден', { status: 404 });
  }
  return NextResponse.json(product);
}
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Ошибка при удалении продукта:', error);
    return new NextResponse('Ошибка на сервере', { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: productId } = await params;
    const body: UpdateProductPayload = await req.json();

    const {
      name,
      status,
      sku,
      variantDetails,
      alternativeNames,
      attributes,
      images,
      inventory,
      categories, // <-- Получаем категории
    } = body;

    const productData = await prisma.product.findUnique({
      where: { id: productId },
      select: { variants: { select: { id: true } } },
    });
    const variantId = productData?.variants[0]?.id;

    if (!variantId) {
      throw new Error('Вариант для обновления не найден.');
    }

    const updatedProduct = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // ... шаги 1-6 без изменений ...
        await tx.product.update({
          where: { id: productId },
          data: { name, status, sku },
        });
        await tx.variant.update({
          where: { id: variantId },
          data: { ...variantDetails },
        });
        await tx.attribute.deleteMany({ where: { productId } });
        if (attributes.length > 0) {
          await tx.attribute.createMany({
            data: attributes.map(({ key, value, isMain }) => ({
              key,
              value,
              isMain,
              productId,
            })),
          });
        }
        await tx.image.deleteMany({ where: { variantId } });
        if (images.length > 0) {
          await tx.image.createMany({
            data: images.map((image, index) => ({
              url: image.url,
              order: index,
              variantId,
            })),
          });
        }
        await tx.inventory.deleteMany({ where: { variantId } });
        if (inventory.length > 0) {
          await tx.inventory.createMany({
            data: inventory.map(({ sizeId, stock }) => ({
              sizeId,
              stock,
              variantId,
            })),
          });
        }
        await tx.alternativeName.deleteMany({ where: { productId } });
        if (alternativeNames.length > 0) {
          await tx.alternativeName.createMany({
            data: alternativeNames.map(({ value }) => ({ value, productId })),
          });
        }

        // VVV--- НАШ НОВЫЙ ШАГ 7: Обновление категорий ---VVV
        await tx.product.update({
          where: { id: productId },
          data: {
            categories: {
              set: categories.map((cat) => ({ id: cat.id })),
            },
          },
        });

        // Шаг 8: Возвращаем полностью обновленный продукт
        return tx.product.findUnique({
          where: { id: productId },
          include: {
            alternativeNames: true,
            variants: {
              include: { images: true, inventory: { include: { size: true } } },
            },
            attributes: true,
            categories: true,
          },
        });
      },
      { timeout: 15000 },
    );

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Ошибка при обновлении продукта:', error);
    // @ts-ignore
    return new NextResponse(error.message || 'Ошибка на сервере', {
      status: 500,
    });
  }
}
