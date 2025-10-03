// Местоположение: src/actions/product-actions.ts

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import prisma from '@/lib/prisma';

// Схемы валидации для Server Actions
const AddSizeSchema = z.object({
  productVariantId: z.string().min(1, 'Product Variant ID обязателен'),
  sizeId: z.string().min(1, 'Size ID обязателен'),
  initialStock: z
    .number()
    .int()
    .min(0, 'Количество не может быть отрицательным'),
});

const AddVariantSchema = z.object({
  productId: z.string().min(1, 'Product ID обязателен'),
  color: z
    .string()
    .min(1, 'Название цвета обязательно')
    .max(50, 'Слишком длинное название'),
});

// Server Action для добавления размера
export async function addProductSize(formData: FormData) {
  try {
    const rawData = {
      productVariantId: formData.get('productVariantId') as string,
      sizeId: formData.get('sizeId') as string,
      initialStock: parseInt(formData.get('initialStock') as string, 10),
    };

    const validatedData = AddSizeSchema.parse(rawData);

    // Проверяем существование варианта
    const variant = await prisma.productVariant.findUnique({
      where: { id: validatedData.productVariantId },
      select: { id: true, productId: true },
    });

    if (!variant) {
      return { success: false, error: 'Вариант товара не найден' };
    }

    // Проверяем, не добавлен ли уже этот размер
    const existingSize = await prisma.productSize.findFirst({
      where: {
        productVariantId: validatedData.productVariantId,
        sizeId: validatedData.sizeId,
      },
    });

    if (existingSize) {
      return { success: false, error: 'Этот размер уже добавлен к варианту' };
    }

    // Создаем новый размер (только обязательные поля)
    const newSize = await prisma.productSize.create({
      data: {
        productVariantId: validatedData.productVariantId,
        sizeId: validatedData.sizeId,
        stock: validatedData.initialStock,
      },
      include: {
        size: {
          select: { id: true, value: true },
        },
      },
    });

    // Revalidate страницы
    revalidatePath(`/admin/products/${variant.productId}/edit`);
    revalidatePath('/admin/dashboard');

    return {
      success: true,
      data: newSize,
      message: 'Размер успешно добавлен',
    };
  } catch (error) {
    console.error('Error adding product size:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(', '),
      };
    }

    return {
      success: false,
      error: 'Не удалось добавить размер',
    };
  }
}

// Server Action для добавления варианта
export async function addProductVariant(formData: FormData) {
  try {
    const rawData = {
      productId: formData.get('productId') as string,
      color: formData.get('color') as string,
    };

    const validatedData = AddVariantSchema.parse(rawData);

    // Проверяем существование продукта
    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId },
      select: { id: true },
    });

    if (!product) {
      return { success: false, error: 'Продукт не найден' };
    }

    // Проверяем уникальность цвета для этого продукта
    const existingVariant = await prisma.productVariant.findFirst({
      where: {
        productId: validatedData.productId,
        color: validatedData.color,
      },
    });

    if (existingVariant) {
      return { success: false, error: 'Вариант с таким цветом уже существует' };
    }

    // Создаем новый вариант (только обязательные поля)
    const newVariant = await prisma.productVariant.create({
      data: {
        productId: validatedData.productId,
        color: validatedData.color,
        price: 0,
        oldPrice: null,
        bonusPoints: null,
        discountExpiresAt: null,
      },
      include: {
        images: {
          select: { id: true, url: true, order: true },
          orderBy: { order: 'asc' },
        },
        sizes: {
          select: {
            id: true,
            stock: true,
            size: {
              select: { id: true, value: true },
            },
          },
          orderBy: { size: { value: 'asc' } },
        },
      },
    });

    // Revalidate страницы
    revalidatePath(`/admin/products/${validatedData.productId}/edit`);
    revalidatePath('/admin/dashboard');

    return {
      success: true,
      data: newVariant,
      message: 'Вариант успешно добавлен',
    };
  } catch (error) {
    console.error('Error adding product variant:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(', '),
      };
    }

    return {
      success: false,
      error: 'Не удалось добавить вариант',
    };
  }
}
