// Местоположение: src/app/catalog/page.tsx
import prisma from '@/lib/prisma';
import CatalogContent from '@/components/CatalogContent';
// --- ИЗМЕНЕНИЕ: Указываем правильный путь к нашему центральному файлу типов ---
import { ProductWithInfo } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function CatalogPage() {
  // --- НАЧАЛО ИЗМЕНЕНИЙ ---
  // Фильтруем по полю 'name' внутри связанной модели 'status'
  const products = await prisma.product.findMany({
    where: {
      status: {
        name: 'PUBLISHED',
      },
    },
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---
    orderBy: { createdAt: 'desc' },
    include: {
      status: true, // Включаем данные о статусе, если они понадобятся на фронте
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
    },
  });

  const productsForCatalog = products.reduce<ProductWithInfo[]>(
    (acc, product) => {
      const firstVariant = product.variants[0];
      if (firstVariant) {
        let imageUrls = firstVariant.images.map((image) => image.url);
        // Этот хардкод лучше будет убрать в будущем
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