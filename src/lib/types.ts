// Местоположение: src/lib/types.ts

import {
  Product,
  AlternativeName,
  Attribute,
  Image as PrismaImage,
  // --- НАЧАЛО ИЗМЕНЕНИЙ (1/2): Заменяем несуществующий Inventory на ProductSize и Size ---
  ProductSize,
  Size,
  // --- КОНЕЦ ИЗМЕНЕНИЙ (1/2) ---
  Category,
  Tag,
  Status, // Добавляем Status, так как он используется ниже
} from '@prisma/client';

// Этот тип используется для карточек товаров в каталоге (без изменений)
export type ProductWithInfo = Product & {
  price: number;
  oldPrice?: number | null;
  imageUrls: string[];
};

// --- НАЧАЛО ИЗМЕНЕНИЙ (2/2): Обновляем тип, чтобы он соответствовал схеме ---
// Этот тип используется в API для обновления данных о товаре
export type UpdateProductPayload = {
  name: string;
  statusId: string; // Работаем с ID, а не с объектом
  sku: string | null;
  // Детали варианта больше не часть этого типа, так как они обновляются отдельно
  // variantDetails: { ... }
  alternativeNames: AlternativeName[];
  attributes: Attribute[];
  // Изображения и размеры относятся к вариантам, а не к продукту напрямую
  // images: PrismaImage[];
  sizes: (ProductSize & { size: Size })[]; // <-- ИСПОЛЬЗУЕМ ПРАВИЛЬНУЮ МОДЕЛЬ
  categories: Category[];
  tags: Tag[];
};
// --- КОНЕЦ ИЗМЕНЕНИЙ (2/2) ---
