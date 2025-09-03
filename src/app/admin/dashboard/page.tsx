// Местоположение: src/app/admin/dashboard/page.tsx
import PageContainer from '@/components/layout/PageContainer';
import ProductTable from '@/components/admin/ProductTable';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// --- НАЧАЛО ИЗМЕНЕНИЙ ---

// 1. Обновляем тип, чтобы он соответствовал новой схеме
export type ProductForTable = Prisma.ProductGetPayload<{
  include: {
    categories: true;
    tags: true;
    attributes: true;
    variants: {
      // Теперь это ProductVariant (например, по цвету)
      include: {
        images: true;
        sizes: {
          // Внутри варианта теперь лежат размеры (ProductSize)
          include: {
            size: true; // А внутри размера - сама модель Size (S, M, L)
          };
        };
      };
    };
  };
}>;

// 2. Старая функция сортировки больше не нужна, так как 'variants' - это цвета, а не размеры.
// const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
// const sortVariantsBySize = (variants: any[]) => { ... };

export default async function DashboardPage() {
  const [allProducts, allCategories, allTags, filterPresets] =
    await Promise.all([
      // 3. Обновляем главный запрос к базе данных
      prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          categories: true,
          tags: true,
          attributes: true,
          variants: {
            // Загружаем варианты (цвета)
            orderBy: { createdAt: 'asc' },
            include: {
              images: { orderBy: { order: 'asc' } },
              sizes: {
                // Для каждого варианта загружаем его размеры
                include: {
                  size: true, // И информацию о самом размере (S, M, L)
                },
              },
            },
          },
        },
      }),
      prisma.category.findMany({ orderBy: { name: 'asc' } }),
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

  // 4. Удаляем вызов старой сортировки
  // allProducts.forEach((product) => {
  //   sortVariantsBySize(product.variants);
  // });
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  return (
    <main>
      <PageContainer className="py-12">
        <ProductTable
          products={allProducts}
          allCategories={allCategories}
          allTags={allTags}
          filterPresets={filterPresets as any}
        />
      </PageContainer>
    </main>
  );
}
