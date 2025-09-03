// Местоположение: src/app/api/products/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// --- НАЧАЛО ИЗМЕНЕНИЙ: ВОЗВРАЩАЕМСЯ К СТАНДАРТНОЙ ТИПИЗАЦИИ NEXT.JS ---
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }, // Стандартный, встроенный тип
) {
  const { id } = params;
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
  { params }: { params: { id: string } }, // Стандартный, встроенный тип
) {
  try {
    const { id } = params;
    await prisma.product.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Ошибка при удалении продукта:', error);
    return new NextResponse('Ошибка на сервере', { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }, // Стандартный, встроенный тип
) {
  try {
    const productId = params.id;
    const body: {
      name: string;
      status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
      sku: string | null;
      variants: any[];
      categories: { id: string }[];
      tags: { id: string }[];
      attributes: { key: string; value: string; isMain: boolean }[];
      alternativeNames: { value: string }[];
    } = await req.json();

    const {
      name,
      status,
      sku,
      variants,
      categories,
      tags,
      attributes,
      alternativeNames,
    } = body;

    const updatedProduct = await prisma.$transaction(
      async (tx) => {
        // Шаг 1: Обновляем основные поля продукта
        await tx.product.update({
          where: { id: productId },
          data: {
            name,
            status,
            sku,
            categories: { set: categories.map((cat) => ({ id: cat.id })) },
            tags: { set: tags.map((tag) => ({ id: tag.id })) },
          },
        });

        // Шаг 2: Полностью заменяем атрибуты и альтернативные имена
        await tx.attribute.deleteMany({ where: { productId } });
        if (attributes && attributes.length > 0) {
          await tx.attribute.createMany({
            data: attributes.map(({ key, value, isMain }) => ({
              key,
              value,
              isMain,
              productId,
            })),
          });
        }
        await tx.alternativeName.deleteMany({ where: { productId } });
        if (alternativeNames && alternativeNames.length > 0) {
          await tx.alternativeName.createMany({
            data: alternativeNames.map(({ value }) => ({ value, productId })),
          });
        }

        // Шаг 3: Полностью заменяем варианты и их вложенные данные
        const oldVariants = await tx.productVariant.findMany({
          where: { productId },
          select: { id: true },
        });
        const oldVariantIds = oldVariants.map((v) => v.id);

        if (oldVariantIds.length > 0) {
          await tx.productSize.deleteMany({
            where: { productVariantId: { in: oldVariantIds } },
          });
          await tx.image.deleteMany({
            where: { variantId: { in: oldVariantIds } },
          });
          await tx.productVariant.deleteMany({ where: { productId } });
        }

        for (const variantData of variants) {
          const newVariant = await tx.productVariant.create({
            data: {
              product: { connect: { id: productId } },
              color: variantData.color,
              price: variantData.price,
              oldPrice: variantData.oldPrice,
              bonusPoints: variantData.bonusPoints,
              discountExpiresAt: variantData.discountExpiresAt,
            },
          });

          if (variantData.images && variantData.images.length > 0) {
            await tx.image.createMany({
              data: variantData.images.map((img: any, index: number) => ({
                url: img.url,
                order: index,
                variantId: newVariant.id,
              })),
            });
          }

          if (variantData.sizes && variantData.sizes.length > 0) {
            await tx.productSize.createMany({
              data: variantData.sizes.map((s: any) => ({
                stock: s.stock,
                sizeId: s.size.id,
                productVariantId: newVariant.id,
                moyskladId: s.moyskladId,
              })),
            });
          }
        }

        // Шаг 4: Возвращаем полностью обновленный продукт
        return tx.product.findUnique({
          where: { id: productId },
          include: {
            alternativeNames: true,
            variants: {
              include: { images: true, sizes: { include: { size: true } } },
            },
            attributes: true,
            categories: true,
            tags: true,
          },
        });
      },
      { timeout: 20000 },
    );

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Ошибка при обновлении продукта:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Ошибка на сервере';
    return new NextResponse(errorMessage, { status: 500 });
  }
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---
