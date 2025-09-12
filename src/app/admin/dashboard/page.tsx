// Местоположение: src/app/admin/dashboard/page.tsx
import PageContainer from '@/components/layout/PageContainer';
import ProductTable from '@/components/admin/ProductTable';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// --- НАЧАЛО ИЗМЕНЕНИЙ: Возвращаем "умный" запрос данных ---
async function getProductsForTable() {
  // Наша новая синхронизация гарантирует, что в таблице Product лежат ТОЛЬКО родительские товары.
  // Но на всякий случай, мы оставляем простую проверку, чтобы отсечь товары, чьи имена
  // были созданы вручную как варианты (например, "Пижама (Синий)")
  const products = await prisma.product.findMany({
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

  // Фильтруем те товары, которые случайно были созданы как варианты
  // (например, если синхронизация была прервана или запущена со старым кодом)
  // Это делает UI более устойчивым к ошибкам данных.
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
