// src/app/product/[id]/page.tsx
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ProductDetails from '@/components/ProductDetails';

export const dynamic = 'force-dynamic';

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'ONESIZE'];

export default async function ProductPage({
  params,
}: {
  // --- НЕБОЛЬШОЕ УЛУЧШЕНИЕ: Убираем Promise, так как Next.js разрешает его автоматически ---
  params: { id: string };
}) {
  const { id } = params;

  const product = await prisma.product.findUnique({
    where: { id },
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

  // Сортируем размеры внутри каждого варианта
  const sortedProduct = {
    ...product,
    variants: product.variants.map((variant) => ({
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
