// Местоположение: src/lib/types.ts
import { Product } from '@prisma/client';

// Теперь это единственное и официальное определение нашего типа.
export type ProductWithInfo = Product & {
  price: number;
  oldPrice?: number | null;
  imageUrls: string[];
};
