// Местоположение: src/app/admin/dashboard/page.tsx
// --- НАЧАЛО ИЗМЕНЕНИЙ: Удаляем мертвый импорт ---
// import PageContainer from '@/components/layout/PageContainer';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---
import ProductTable from '@/components/admin/ProductTable';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function getProductsForTable() {
  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' },
    include: {
      status: true,
      categories: true,
      tags: true,
      attributes: true,
      variants: {
        orderBy: { color: 'asc' },
        include: {
          images: { orderBy: { order: 'asc' } },
          sizes: {
            orderBy: { size: { value: 'asc' } },
            include: {
              size: true,
            },
          },
        },
      },
    },
  });
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

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Удаляем все обертки и возвращаем чистый компонент ---
  return (
    <ProductTable
      products={allProducts}
      allCategories={allCategories}
      allTags={allTags}
      filterPresets={filterPresets as any}
    />
  );
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
}
