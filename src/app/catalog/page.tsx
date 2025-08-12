// Местоположение: src/app/catalog/page.tsx
import prisma from '@/lib/prisma';
import CatalogContent from '@/components/CatalogContent';
import { Product } from '@prisma/client';

// --- ИЗМЕНЕНИЕ: Указываем правильный путь к нашему центральному файлу типов ---
import { ProductWithInfo } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  const products = await prisma.product.findMany({
    where: { status: 'PUBLISHED' },
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
    },
  });

  const productsForCatalog = products.reduce<ProductWithInfo[]>(
    (acc, product) => {
      const firstVariant = product.variants[0];
      if (firstVariant) {
        let imageUrls = firstVariant.images.map((image) => image.url);
        if (product.name === 'Комплект двойка') {
          imageUrls.push('/Фото - 3.png', '/Фото - 4.png');
        }
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
    <div className="container mx-auto px-4 pt-8 sm:px-6 lg:px-8 xl:px-12">
      <CatalogContent products={productsForCatalog} isLoading={false} />
    </div>
  );
}
