// Местоположение: src/lib/types.ts

import {
  Product,
  AlternativeName,
  Attribute,
  Image as PrismaImage,
  ProductSize,
  Size,
  Category,
  Tag,
  Status,
  // --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем недостающие импорты ---
  User as PrismaUser, // Импортируем User под псевдонимом, чтобы избежать конфликтов
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
} from '@prisma/client';

// --- НАЧАЛО ИЗМЕНЕНИЙ: Явно реэкспортируем все типы, которые нам нужны в приложении ---
export type User = PrismaUser;
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

// Этот тип используется для карточек товаров в каталоге (без изменений)
export type ProductWithInfo = Product & {
  price: number;
  oldPrice?: number | null;
  imageUrls: string[];
};

// Этот тип используется в API для обновления данных о товаре (без изменений)
export type UpdateProductPayload = {
  name: string;
  statusId: string;
  sku: string | null;
  alternativeNames: AlternativeName[];
  attributes: Attribute[];
  sizes: (ProductSize & { size: Size })[];
  categories: Category[];
  tags: Tag[];
};
