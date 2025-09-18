// Местоположение: src/app/admin/dashboard/page.tsx
import PageContainer from '@/components/layout/PageContainer';
import ProductTable from '@/components/admin/ProductTable';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function getProductsForTable() {
  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' }, // Сортируем по имени для предсказуемости
    include: {
      status: true,
      categories: true,
      tags: true,
      attributes: true,
      variants: {
        orderBy: { color: 'asc' }, // Сортируем варианты по цвету
        include: {
          images: { orderBy: { order: 'asc' } },
          sizes: {
            orderBy: { size: { value: 'asc' } }, // Сортируем размеры по значению
            include: {
              size: true,
            },
          },
        },
      },
    },
  });

  // --- ИЗМЕНЕНИЕ: Убираем старый, слишком строгий фильтр. ---
  // Наша новая логика синхронизации сама создает правильные родительские товары.
  // Этот фильтр больше не нужен.
  return products;
}

export type ProductForTable = Awaited<
  ReturnType<typeof getProductsForTable>
>[0];

export default async function DashboardPage() {
  const [allProducts, allCategories, allTags, filterPresets] =
    await Promise.all([
      getProductsForTable(),
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
