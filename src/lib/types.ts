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
  User as PrismaUser, // Импортируем User под псевдонимом, чтобы избежать конфликтов
} from '@prisma/client';

// Явно реэкспортируем нужные типы
export type User = PrismaUser;

// Тип для карточек товаров в каталоге
export type ProductWithInfo = Product & {
  price: number;
  oldPrice?: number | null;
  imageUrls: string[];
  categoryIds: string[];
};

// Тип для обновления данных о товаре через API
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
