// Местоположение: src/app/product/[id]/page.tsx
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ProductDetails from '@/components/ProductDetails';

export const dynamic = 'force-dynamic';

// ИЗМЕНЕНИЕ: Мы извлекаем { id } прямо из params в сигнатуре функции
export default async function ProductPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: {
        include: {
          images: true,
          inventory: {
            include: {
              size: true,
            },
          },
        },
      },
      attributes: true,
    },
  });

  if (!product) {
    notFound();
  }

  return <ProductDetails product={product} />;
}
