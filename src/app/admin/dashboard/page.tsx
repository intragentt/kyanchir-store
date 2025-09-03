// Местоположение: src/app/admin/dashboard/page.tsx
import PageContainer from '@/components/layout/PageContainer';
import ProductTable from '@/components/admin/ProductTable';
import prisma from '@/lib/prisma';
// Удаляем `import { Prisma } from '@prisma/client'`, он больше не нужен для типов здесь

export const dynamic = 'force-dynamic';

// --- НАЧАЛО ИЗМЕНЕНИЙ: ИСПОЛЬЗУЕМ СТАНДАРТНЫЙ TYPESCRIPT ---

// 1. Создаем async функцию, которая получает наши данные
async function getProductsForTable() {
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
  return products;
}

// 2. Выводим тип одного продукта из того, что возвращает функция.
// Awaited<...> "разворачивает" Promise.
// ReturnType<...> получает тип того, что возвращает функция.
// [0] берет тип одного элемента из массива.
export type ProductForTable = Awaited<
  ReturnType<typeof getProductsForTable>
>[0];

// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export default async function DashboardPage() {
  const [allProducts, allCategories, allTags, filterPresets] =
    await Promise.all([
      getProductsForTable(), // Используем нашу новую функцию
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
