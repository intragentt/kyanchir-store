// Местоположение: src/app/admin/products/[id]/edit/page.tsx
export const dynamic = 'force-dynamic';

import PageContainer from '@/components/layout/PageContainer';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import EditProductForm from '@/components/admin/EditProductForm';

interface EditProductPageProps {
  params: {
    id: string;
  };
}

async function getProductWithDetails(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      status: true,
      alternativeNames: true,
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
      attributes: true,
      categories: true,
      tags: true,
    },
  });
  return product;
}

export type ProductWithDetails = NonNullable<
  Awaited<ReturnType<typeof getProductWithDetails>>
>;

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = params;

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем загрузку всех статусов ---
  const [product, allSizes, allCategories, allTags, allStatuses] = // <-- Добавили allStatuses
    await Promise.all([
      getProductWithDetails(id),
      prisma.size.findMany({
        orderBy: { value: 'asc' },
      }),
      prisma.category.findMany({
        orderBy: { name: 'asc' },
      }),
      prisma.tag.findMany({
        orderBy: { name: 'asc' },
      }),
      // VVV--- ДОБАВЛЕНА ЭТА СТРОКА ---VVV
      prisma.status.findMany({
        orderBy: { name: 'asc' },
      }),
    ]);
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  if (!product) {
    notFound();
  }

  return (
    <main>
      <PageContainer className="py-10">
        <div>
          <Link
            href="/admin/products" // <-- Более корректный путь назад
            className="text-sm font-medium text-gray-500 hover:text-gray-800"
          >
            ← Назад к товарам
          </Link>
          <div className="mt-2 md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <div className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                Редактирование товара
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Передаем allStatuses в компонент --- */}
          <EditProductForm
            product={product}
            allSizes={allSizes}
            allCategories={allCategories}
            allTags={allTags}
            allStatuses={allStatuses} // <-- Передаем статусы
          />
          {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
        </div>
      </PageContainer>
    </main>
  );
}
