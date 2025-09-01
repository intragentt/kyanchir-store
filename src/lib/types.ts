// Местоположение: src/lib/types.ts

import {
  Product,
  AlternativeName,
  Attribute,
  Image as PrismaImage,
  Inventory,
  Category,
  Tag,
} from '@prisma/client';

// ВАЖНО: Мы удалили все расширения типов `next-auth` и `User` отсюда,
// так как вся эта логика теперь централизованно находится в /src/types/next-auth.d.ts
// Это решает ошибку сборки "All declarations of 'User' must have identical modifiers".

// Этот тип используется для карточек товаров в каталоге (без изменений)
export type ProductWithInfo = Product & {
  price: number;
  oldPrice?: number | null;
  imageUrls: string[];
};

// Этот тип используется в API для обновления данных о товаре
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
  tags: Tag[];
};
