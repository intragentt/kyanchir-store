// Местоположение: src/app/(site)/catalog/page.tsx

import prisma from '@/lib/prisma';
import CatalogContent from '@/components/CatalogContent';
import { ProductWithInfo } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  const products = await prisma.product.findMany({
    where: {
      status: {
        name: 'PUBLISHED',
      },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      status: true,
      variants: {
        include: {
          images: {
            orderBy: { order: 'asc' },
          },
          sizes: {
            include: {
              size: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      categories: {
        select: { id: true },
      },
    },
  });

  const productsForCatalog = products.reduce<ProductWithInfo[]>(
    (acc, product) => {
      const variantWithPrice = product.variants.find(
        (variant) => variant.price !== null && variant.price > 0,
      );

      if (!variantWithPrice) {
        return acc;
      }

      const imageUrls = variantWithPrice.images.map((image) => image.url);
      if (product.name === 'Комплект двойка') {
        imageUrls.push('/Фото - 3.png', '/Фото - 4.png');
      }

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

  return (
    <div className="container mx-auto px-4 pt-8 sm:px-6 lg:px-8 xl:px-12">
      <CatalogContent products={productsForCatalog} isLoading={false} />
    </div>
  );
}
