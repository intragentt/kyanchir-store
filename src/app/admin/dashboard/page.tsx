// Местоположение: src/app/admin/dashboard/page.tsx

import ProductTable from '@/components/admin/ProductTable';
import { PRODUCT_TABLE_CONFIG } from '@/lib/constants/admin';
import prisma from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

export const dynamic = 'force-dynamic';

// Кэшированные справочники
const getCachedReferenceData = unstable_cache(
  async () => {
    return await Promise.all([
      prisma.category.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.tag.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.status.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.filterPreset.findMany({
        select: {
          id: true,
          name: true,
          items: {
            select: {
              id: true,
              order: true,
              category: { select: { id: true, name: true } },
              tag: { select: { id: true, name: true } },
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);
  },
  ['reference-data'],
  { revalidate: 3600 },
);

// Оптимизированный запрос продуктов
async function getOptimizedProductsForTable() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      article: true,
      createdAt: true,
      updatedAt: true,
      statusId: true,
      status: {
        select: { id: true, name: true },
      },
      categories: {
        select: { id: true, name: true },
      },
      tags: {
        select: { id: true, name: true },
      },
      variants: {
        select: {
          id: true,
          color: true,
          price: true,
          oldPrice: true,
          isFeatured: true,
          images: {
            select: { id: true, url: true },
            take: 1,
            orderBy: { order: 'asc' },
          },
          sizes: {
            select: {
              id: true,
              stock: true,
              size: {
                select: { id: true, value: true },
              },
            },
            orderBy: { size: { value: 'asc' } },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      _count: {
        select: {
          attributes: true,
          alternativeNames: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: PRODUCT_TABLE_CONFIG.PAGE_SIZE,
  });

  return products;
}

export type OptimizedProductForTable = Awaited<
  ReturnType<typeof getOptimizedProductsForTable>
>[0];

export default async function DashboardPage() {
  const [products, referenceData] = await Promise.all([
    getOptimizedProductsForTable(),
    getCachedReferenceData(),
  ]);

  const [categories, tags, statuses, filterPresets] = referenceData;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center space-x-4 text-sm text-blue-800">
          <span>📊 Загружено: {products.length} товаров</span>
          <span>⚡ Справочники кэшированы</span>
          <span>🎯 Оптимизированные запросы</span>
        </div>
      </div>

      <ProductTable
        products={products}
        allCategories={categories}
        allTags={tags}
        allStatuses={statuses}
        filterPresets={filterPresets}
      />
    </div>
  );
}
