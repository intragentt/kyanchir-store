// Местоположение: src/app/page.tsx

import prisma from '@/lib/prisma';
import React from 'react';
import HomePageClient from '@/components/HomePageClient';
import { ProductWithInfo } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [productsData, mainFilterPreset] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        variants: {
          include: {
            images: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        categories: {
          select: { id: true },
        },
      },
    }),
    prisma.filterPreset.findUnique({
      where: { name: 'main-store-filter' },
      include: {
        items: {
          orderBy: { order: 'asc' },
          include: {
            category: true,
          },
        },
      },
    }),
  ]);

  const productsForCatalog = productsData.reduce<ProductWithInfo[]>(
    (acc, product) => {
      const variantWithPrice = product.variants.find(
        (variant) => variant.price !== null && variant.price > 0,
      );

      if (!variantWithPrice) {
        return acc;
      }

      const imageUrls = variantWithPrice.images.map((image) => image.url);

      acc.push({
        ...product,
        price: variantWithPrice.price,
        oldPrice: variantWithPrice.oldPrice,
        imageUrls,
        categoryIds: product.categories.map((category) => category.id),
      });

      return acc;
    },
    [],
  );

  let categoriesFromPreset: { id: string; name: string }[] = [];

  if (mainFilterPreset && mainFilterPreset.items) {
    categoriesFromPreset = mainFilterPreset.items
      .filter((item) => item.category)
      .map((item) => ({
        id: item.category!.id,
        name: item.category!.name,
      }));
  }

  const categoriesForFilter = [
    { id: 'all', name: 'все товары' },
    ...categoriesFromPreset,
  ];

  return (
    <>
      <HomePageClient
        initialProducts={productsForCatalog}
        categories={categoriesForFilter}
      />
    </>
  );
}
