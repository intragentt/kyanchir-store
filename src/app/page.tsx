// Местоположение: src/app/page.tsx

import prisma from '@/lib/prisma';
import React from 'react';

// Импорт DynamicHeroSection здесь больше не нужен
import HomePageClient from '@/components/HomePageClient';
import { ProductWithInfo } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    include: {
      variants: {
        include: {
          images: {
            orderBy: {
              order: 'asc',
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  const productsForCatalog = products.reduce<ProductWithInfo[]>(
    (acc, product) => {
      const firstVariant = product.variants[0];
      if (firstVariant) {
        let imageUrls = firstVariant.images.map((image) => image.url);
        acc.push({
          ...product,
          price: firstVariant.price,
          oldPrice: firstVariant.oldPrice,
          imageUrls: imageUrls,
        });
      }
      return acc;
    },
    [],
  );

  return (
    <>
      {/* --- ГЛАВНОЕ ИЗМЕНЕНИЕ: Слайдер отсюда УДАЛЕН --- */}
      <HomePageClient initialProducts={productsForCatalog} />
    </>
  );
}
