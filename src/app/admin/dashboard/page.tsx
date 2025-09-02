// Местоположение: src/app/admin/dashboard/page.tsx

import PageContainer from '@/components/layout/PageContainer';
import ProductTable from '@/components/admin/ProductTable';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// 1. Создаем новый, правильный тип для наших данных.
// Теперь это ПРОДУКТ со всеми вложенными связями, а не вариант.
export type ProductForTable = Prisma.ProductGetPayload<{
  include: {
    categories: true;
    tags: true;
    attributes: true;
    variants: {
      include: {
        images: true;
        inventory: {
          include: {
            size: true;
          };
        };
      };
    };
  };
}>;

const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL']; // Расширяем на всякий случай
// 2. Сортировка теперь принимает массив вариантов, а не инвентаря
const sortVariantsBySize = (variants: any[]) => {
  return variants.sort((a, b) => {
    // Предполагаем, что у варианта может быть только один инвентарь (размер)
    const sizeA = a.inventory[0]?.size.value;
    const sizeB = b.inventory[0]?.size.value;
    const indexA = sizeA ? sizeOrder.indexOf(sizeA) : Infinity;
    const indexB = sizeB ? sizeOrder.indexOf(sizeB) : Infinity;
    return indexA - indexB;
  });
};

export default async function DashboardPage() {
  // 3. Основной запрос теперь к ПРОДУКТАМ, а не к вариантам
  const [allProducts, allCategories, allTags, filterPresets] =
    await Promise.all([
      prisma.product.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        // Подтягиваем ВСЮ необходимую информацию одним мощным запросом
        include: {
          categories: true,
          tags: true,
          attributes: true,
          variants: {
            include: {
              images: { orderBy: { order: 'asc' } },
              inventory: {
                include: {
                  size: true,
                },
              },
            },
          },
        },
      }),
      prisma.category.findMany({
        orderBy: { name: 'asc' },
        // Получаем все категории, чтобы строить иерархию на клиенте
      }),
      prisma.tag.findMany({ orderBy: { name: 'asc' } }),
      prisma.filterPreset.findMany({
        include: {
          items: {
            orderBy: { order: 'asc' },
            include: { category: true, tag: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

  // 4. Применяем сортировку размеров к вариантам КАЖДОГО продукта.
  allProducts.forEach((product) => {
    sortVariantsBySize(product.variants);
  });

  return (
    <main>
      <PageContainer className="py-12">
        {/* 5. Передаем в таблицу новый prop `products` вместо `variants` */}
        <ProductTable
          products={allProducts}
          allCategories={allCategories}
          allTags={allTags}
          filterPresets={filterPresets}
        />
      </PageContainer>
    </main>
  );
}
