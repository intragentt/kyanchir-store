// src/app/admin/dashboard/page.tsx

import PageContainer from '@/components/layout/PageContainer';
import ProductTable from '@/components/admin/ProductTable';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// --- НАЧАЛО ИЗМЕНЕНИЙ: типобезопасный запрос без not: null ---
async function getProductsForTable() {
  // 1) Берём productId всех строк-«вариантов»
  // (без where — забираем всё и фильтруем на JS-стороне, чтобы не упереться в типы Prisma)
  const variantProductLinks = await prisma.productVariant.findMany({
    select: { productId: true },
  });

  const variantProductIds = variantProductLinks
    .map((v) => v.productId)
    .filter((id): id is string => Boolean(id));

  // 2) Запрашиваем только «корневые» товары (не те, что являются отдельными строками-вариантами)
  const products = await prisma.product.findMany({
    where: {
      id: { notIn: variantProductIds },
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
          sizes: { include: { size: true } },
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
