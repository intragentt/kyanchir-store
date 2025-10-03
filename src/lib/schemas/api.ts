// Местоположение: src/lib/schemas/api.ts

import { z } from 'zod';

// Схема для bulk-update-status API
export const BulkUpdateStatusSchema = z.object({
  productIds: z
    .array(z.string().min(1, 'Product ID не может быть пустым'))
    .min(1, 'Необходимо выбрать хотя бы один товар'),
  status: z.object({
    id: z.string().min(1, 'Status ID не может быть пустым'),
    name: z.string().optional(),
  }),
});

// Схема для обновления размеров в batch-update
export const SizeUpdateSchema = z.object({
  id: z.string().min(1, 'Size ID не может быть пустым'),
  stock: z.number().int().min(0, 'Количество не может быть отрицательным'),
});

// Схема для batch-update вариантов
export const BatchUpdateVariantsSchema = z.object({
  variants: z
    .array(
      z.object({
        id: z.string().min(1, 'Variant ID не может быть пустым'),
        price: z.number().positive('Цена должна быть положительной'),
        oldPrice: z.number().nullable().optional(),
        bonusPoints: z.number().int().min(0).nullable().optional(),
        discountExpiresAt: z.date().nullable().optional(),
        sizes: z.array(SizeUpdateSchema),
        product: z.object({
          id: z.string().min(1, 'Product ID не может быть пустым'),
          status: z
            .object({
              id: z.string().min(1, 'Status ID не может быть пустым'),
            })
            .optional(),
          categories: z
            .array(
              z.object({
                id: z.string().min(1, 'Category ID не может быть пустым'),
              }),
            )
            .optional(),
          tags: z
            .array(
              z.object({
                id: z.string().min(1, 'Tag ID не может быть пустым'),
              }),
            )
            .optional(),
        }),
      }),
    )
    .min(1, 'Необходимо указать хотя бы один вариант для обновления'),
});

// Схема для update-category API
export const UpdateCategorySchema = z.object({
  productId: z.string().min(1, 'Product ID не может быть пустым'),
  newCategoryId: z.string().min(1, 'Category ID не может быть пустым'),
});

// Типы для TypeScript
export type BulkUpdateStatusRequest = z.infer<typeof BulkUpdateStatusSchema>;
export type BatchUpdateVariantsRequest = z.infer<
  typeof BatchUpdateVariantsSchema
>;
export type UpdateCategoryRequest = z.infer<typeof UpdateCategorySchema>;
