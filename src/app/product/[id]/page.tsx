// src/app/product/[id]/page.tsx
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ProductDetails from '@/components/ProductDetails';

export const dynamic = 'force-dynamic';

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'ONESIZE'];

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: {
        include: {
          images: true,
          inventory: { include: { size: true } },
        },
      },
      attributes: true,
    },
  });

  if (!product) notFound();

  const sortedProduct = {
    ...product,
    variants: product.variants.map((variant) => ({
      ...variant,
      inventory: [...variant.inventory].sort((a, b) => {
        // --- НАЧАЛО ИЗМЕНЕНИЙ ---
        const sizeA = a.size.value.toUpperCase(); // Исправлено с .name на .value
        const sizeB = b.size.value.toUpperCase(); // Исправлено с .name на .value
        // --- КОНЕЦ ИЗМЕНЕНИЙ ---
        const indexA = SIZE_ORDER.indexOf(sizeA);
        const indexB = SIZE_ORDER.indexOf(sizeB);

        // Если размера нет в нашем списке, отправляем его в конец
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;

        return indexA - indexB;
      }),
    })),
  };

  return <ProductDetails product={sortedProduct} />;
}
