// Местоположение: src/app/admin/dashboard/page.tsx
import PageContainer from '@/components/layout/PageContainer';
import ProductTable from '@/components/admin/ProductTable';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// --- НАЧАЛО ИЗМЕНЕНИЙ: НОВЫЙ, ПРАВИЛЬНЫЙ СПОСОБ ПОЛУЧЕНИЯ ТИПОВ ---

// 1. Определяем структуру данных, которую мы хотим получать, с помощью Prisma.validator
const productWithDetails = Prisma.validator<Prisma.ProductDefaultArgs>()({
  include: {
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

// 2. Создаем и экспортируем наш тип на основе этой структуры
export type ProductForTable = Prisma.ProductGetPayload<
  typeof productWithDetails
>;

// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export default async function DashboardPage() {
  // --- НАЧАЛО ИЗМЕНЕНИЙ: ИСПОЛЬЗУЕМ СОЗДАННУЮ СТРУКТУРУ В ЗАПРОСЕ ---
  const [allProducts, allCategories, allTags, filterPresets] =
    await Promise.all([
      prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        ...productWithDetails, // Используем наш валидатор здесь
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
