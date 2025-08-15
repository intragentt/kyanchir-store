// Местоположение: src/lib/types.ts

import {
  Product,
  AlternativeName,
  Attribute,
  Image as PrismaImage,
  Inventory,
  Category,
  Tag, // --- ИЗМЕНЕНИЕ: Импортируем Tag ---
} from '@prisma/client';

// Этот тип используется для карточек товаров в каталоге (без изменений)
export type ProductWithInfo = Product & {
  price: number;
  oldPrice?: number | null;
  imageUrls: string[];
};

// Это наш финальный "контракт" для API
export type UpdateProductPayload = {
  name: string;
  status: Product['status'];
  sku: string | null;
  variantDetails: {
    price: number;
    oldPrice: number | null;
    bonusPoints: number | null;
    discountExpiresAt: Date | null;
  };
  alternativeNames: AlternativeName[];
  attributes: Attribute[];
  images: PrismaImage[];
  inventory: Inventory[];
  categories: Category[];
  tags: Tag[]; // --- ИЗМЕНЕНИЕ: Добавляем теги в контракт ---
};
