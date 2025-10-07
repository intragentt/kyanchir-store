// src/app/(site)/p/[slug]/page.tsx
import prisma from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import ProductDetails from '@/components/ProductDetails';
import { createSlug } from '@/utils/createSlug';

export const dynamic = 'force-dynamic';

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'ONESIZE'];

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  const product = await prisma.product.findFirst({
    where: {
      OR: [
        { slug },
        { id: slug },
      ],
    },
    include: {
      variants: {
        include: {
          images: {
            orderBy: {
              order: 'asc',
            },
          },
          // --- НАЧАЛО ИЗМЕНЕНИЙ (1/2): Используем правильное имя связи 'sizes' ---
          sizes: {
            include: {
              size: true,
            },
          },
          // --- КОНЕЦ ИЗМЕНЕНИЙ (1/2) ---
        },
      },
      attributes: true,
      status: true, // Включаем статус, чтобы можно было его отобразить
    },
  });

  if (!product) {
    notFound();
  }

  const canonicalSlug = product.slug ?? createSlug(product.name);

  if (canonicalSlug !== slug) {
    redirect(`/p/${canonicalSlug}`);
  }

  const normalizedProduct = product.slug
    ? product
    : { ...product, slug: canonicalSlug };

  // Сортируем размеры внутри каждого варианта
  const sortedProduct = {
    ...normalizedProduct,
    variants: normalizedProduct.variants.map((variant) => ({
      ...variant,
      // --- НАЧАЛО ИЗМЕНЕНИЙ (2/2): Используем правильное имя 'sizes' и для сортировки ---
      sizes: [...variant.sizes].sort((a, b) => {
        const sizeA = a.size.value.toUpperCase();
        const sizeB = b.size.value.toUpperCase();
        // --- КОНЕЦ ИЗМЕНЕНИЙ (2/2) ---
        const indexA = SIZE_ORDER.indexOf(sizeA);
        const indexB = SIZE_ORDER.indexOf(sizeB);

        if (indexA === -1) return 1;
        if (indexB === -1) return -1;

        return indexA - indexB;
      }),
    })),
  };

  return <ProductDetails product={sortedProduct} />;
}
