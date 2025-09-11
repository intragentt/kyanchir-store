// Местоположение: src/app/admin/dashboard/page.tsx
import PageContainer from '@/components/layout/PageContainer';
import ProductTable from '@/components/admin/ProductTable';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// --- НАЧАЛО ИЗМЕНЕНИЙ: Возвращаем "умный" запрос данных ---
async function getProductsForTable() {
  // 1. Собираем "черный список" - ID всех товаров, которые являются вариантами
  // Мы ищем в НАШЕЙ таблице ProductVariant, чтобы найти все moyskladId, которые мы УЖЕ определили как варианты.
  const variants = await prisma.productVariant.findMany({
    where: {
      moySkladId: {
        not: null,
      },
    },
    select: {
      moySkladId: true,
    },
  });
  const variantMoySkladIds = variants.map((v) => v.moySkladId as string);

  // 2. Запрашиваем только те товары, которые НЕ входят в этот список
  const products = await prisma.product.findMany({
    where: {
      moyskladId: {
        notIn: variantMoySkladIds,
      },
    },
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
