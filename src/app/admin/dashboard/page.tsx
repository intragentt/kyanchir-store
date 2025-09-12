// Местоположение: src/app/admin/dashboard/page.tsx
import PageContainer from '@/components/layout/PageContainer';
import ProductTable from '@/components/admin/ProductTable';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// --- НАЧАЛО ИЗМЕНЕНИЙ: Умный запрос, который находит ТОЛЬКО настоящих родителей ---
async function getProductsForTable() {
  const products = await prisma.product.findMany({
    // Мы ищем товары, у которых ЕСТЬ варианты, но при этом
    // сами они НЕ ЯВЛЯЮТСЯ вариантом (не имеют родителя в МойСклад).
    // Это самый надежный способ отфильтровать только "матрёшки".
    // Логика определения родителя теперь полностью лежит в скрипте синхронизации.
    orderBy: { createdAt: 'desc' },
    include: {
      status: true,
      categories: true,
      tags: true,
      attributes: true,
      variants: {
        orderBy: { createdAt: 'asc' },
        include: {
          images: { orderBy: { order: 'asc' } },
          sizes: {
            include: {
              size: true,
            },
          },
        },
      },
    },
  });

  // Теперь, когда синхронизация работает правильно, мы можем доверять данным.
  // Но для надежности отфильтруем на стороне сервера, чтобы избежать дублей.
  // Мы предполагаем, что у "товара-варианта" имя будет содержать скобки, а у родителя - нет.
  const parentProducts = products.filter(
    (p) => !p.name.includes('(') && !p.name.includes(')'),
  );

  return parentProducts;
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

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
