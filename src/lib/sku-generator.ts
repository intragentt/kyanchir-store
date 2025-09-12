// Местоположение: src/lib/sku-generator.ts

import { PrismaClient } from '@prisma/client';

/**
 * Генерирует артикул для нового продукта на основе категории, подкатегории, даты и порядкового номера.
 * @param prisma - Экземпляр PrismaClient.
 * @param subcategoryId - ID подкатегории, к которой принадлежит товар.
 * @returns {Promise<string>} - Сгенерированный артикул (например, 'KYN-BE-KP-2509-001').
 */
export async function generateProductSku(
  prisma: PrismaClient,
  subcategoryId: string,
): Promise<string> {
  // 1. Получаем коды категории и подкатегории
  const subcategory = await prisma.category.findUnique({
    where: { id: subcategoryId },
    include: { parent: true },
  });

  if (!subcategory || !subcategory.parent) {
    throw new Error(
      'Для генерации артикула товар должен принадлежать подкатегории, у которой есть родительская категория.',
    );
  }

  const catCode = subcategory.parent.code.toUpperCase();
  const subCatCode = subcategory.code.toUpperCase();
  const categoryPart = `${catCode}-${subCatCode}`;

  // 2. Формируем часть с датой (ГГММ)
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const datePart = `${year}${month}`;

  // 3. Вычисляем порядковый номер
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const productsInMonth = await prisma.product.count({
    where: {
      createdAt: {
        gte: startOfMonth,
        lt: nextMonth,
      },
    },
  });

  const sequenceNumber = (productsInMonth + 1).toString().padStart(3, '0');

  // 4. Собираем финальный артикул
  const article = `KYN-${categoryPart}-${datePart}-${sequenceNumber}`;

  return article;
}

/**
 * Генерирует артикул для варианта продукта.
 * @param parentArticle - Артикул родительского продукта.
 * @param existingVariantCount - Количество уже существующих вариантов у этого продукта.
 * @returns {string} - Сгенерированный артикул (например, 'KYN-BE-KP-2509-001-V1').
 */
export function generateVariantSku(
  parentArticle: string,
  existingVariantCount: number,
): string {
  const newVariantNumber = existingVariantCount + 1;
  return `${parentArticle}-V${newVariantNumber}`;
}

/**
 * Генерирует артикул для конкретного размера варианта.
 * @param variantArticle - Артикул родительского варианта (например, '...-V1').
 * @param sizeValue - Значение размера (например, 'M', 'ONE_SIZE').
 * @returns {string} - Сгенерированный артикул (например, '...-V1-SM').
 */
export function generateSizeSku(
  variantArticle: string,
  sizeValue: string,
): string {
  // Преобразуем 'M' в 'SM', 'L' в 'SL', 'ONE_SIZE' в 'SONESIZE' и т.д.
  const sizeCode = `S${sizeValue.replace(/_/g, '')}`.toUpperCase();
  return `${variantArticle}-${sizeCode}`;
}
