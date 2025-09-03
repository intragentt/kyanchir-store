// Местоположение: src/app/api/products/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET и DELETE остаются без изменений
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  // ... (код без изменений)
}
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  // ... (код без изменений)
}

// --- НАЧАЛО ИЗМЕНЕНИЙ: ПОЛНЫЙ РЕФАКТОРИНГ PUT-ЗАПРОСА ---
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const productId = params.id;
    // Типизируем тело запроса в соответствии с новой структурой
    const body: {
      name: string;
      status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
      sku: string | null;
      variants: any[]; // Принимаем массив вариантов
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
        // Шаг 1: Обновляем основные поля самого продукта
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

        // Шаг 2: Полностью заменяем атрибуты и альтернативные имена (стратегия "удалить и создать")
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
        // Сначала находим все старые варианты, чтобы удалить их "детей"
        const oldVariants = await tx.productVariant.findMany({
          where: { productId },
          select: { id: true },
        });
        const oldVariantIds = oldVariants.map((v) => v.id);

        if (oldVariantIds.length > 0) {
          // Удаляем сначала "внуков" (размеры) и "детей" (картинки)
          await tx.productSize.deleteMany({
            where: { productVariantId: { in: oldVariantIds } },
          });
          await tx.image.deleteMany({
            where: { variantId: { in: oldVariantIds } },
          });
          // Затем удаляем сами старые варианты
          await tx.productVariant.deleteMany({ where: { productId } });
        }

        // Теперь создаем все варианты заново из данных, пришедших с фронтенда
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

          // Создаем картинки для нового варианта
          if (variantData.images && variantData.images.length > 0) {
            await tx.image.createMany({
              data: variantData.images.map((img: any, index: number) => ({
                url: img.url,
                order: index,
                variantId: newVariant.id,
              })),
            });
          }

          // Создаем размеры для нового варианта
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

        // Шаг 4: Возвращаем полностью обновленный продукт с новыми данными
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
