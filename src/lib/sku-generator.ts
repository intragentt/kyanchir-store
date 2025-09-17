// Местоположение: src/lib/sku-generator.ts

import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';

/**
 * Генерирует уникальный, "вечный" артикул для нового продукта.
 * Формат: KYN-[CATCODE]-[MMYY]-[XXXX]
 * @param prisma - Экземпляр PrismaClient для выполнения транзакции.
 * @param categoryId - ID категории товара.
 * @returns {Promise<string>} - Сгенерированный артикул (например, 'KYN-KP2-0925-0001').
 */
export async function generateProductSku(
  prisma: PrismaClient,
  categoryId: string,
): Promise<string> {
  // 1. Получаем код категории
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    throw new Error('Категория для генерации артикула не найдена.');
  }

  const catCode = category.code.toUpperCase();

  // 2. Формируем префикс с датой (ММГГ)
  const datePart = format(new Date(), 'MMyy'); // e.g., 0925
  const prefix = `KYN-${catCode}-${datePart}`;

  // 3. В рамках транзакции получаем следующий номер в последовательности
  const nextNumber = await prisma.$transaction(async (tx) => {
    // Находим или создаем счетчик для нашего префикса.
    // upsert - атомарная операция, безопасная для одновременных запросов.
    const sequence = await tx.skuSequence.upsert({
      where: { prefix: prefix },
      // Если счетчика нет, создаем его со значением 1.
      create: {
        prefix: prefix,
        lastNumber: 1,
      },
      // Если есть, увеличиваем на 1.
      update: {
        lastNumber: {
          increment: 1,
        },
      },
    });
    return sequence.lastNumber;
  });

  // 4. Форматируем номер до 4 знаков (e.g., 1 -> '0001')
  const sequencePart = nextNumber.toString().padStart(4, '0');

  // 5. Собираем и возвращаем финальный артикул
  return `${prefix}-${sequencePart}`;
}

/**
 * Генерирует артикул для варианта продукта.
 * @param parentArticle - Артикул родительского продукта.
 * @param existingVariantCount - Количество уже существующих вариантов у этого продукта.
 * @returns {string} - Сгенерированный артикул (например, '...-V1').
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
  const sizeCode = `S${sizeValue.replace(/_/g, '')}`.toUpperCase();
  return `${variantArticle}-${sizeCode}`;
}
