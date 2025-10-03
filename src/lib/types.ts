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
  User as PrismaUser,
  ProductVariant,
  Prisma,
} from '@prisma/client';

// Реэкспорт базовых Prisma типов
export type User = PrismaUser;

// Тип для карточек товаров в каталоге
export type ProductWithInfo = Product & {
  price: number;
  oldPrice?: number | null;
  imageUrls: string[];
  categoryIds: string[];
};

// Тип для админской страницы редактирования товара
export type ProductWithDetails = Product & {
  status: Status;
  alternativeNames: AlternativeName[];
  variants: (ProductVariant & {
    images: PrismaImage[];
    sizes: (ProductSize & {
      size: Size;
    })[];
  })[];
  attributes: Attribute[];
  categories: Category[];
  tags: Tag[];
};

// Тип для продукта со статусом (для админских компонентов)
export type ProductWithStatus = Product & {
  status: Status;
};

// Тип для статуса продукта (для API)
export type ProductStatus = Status;

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
