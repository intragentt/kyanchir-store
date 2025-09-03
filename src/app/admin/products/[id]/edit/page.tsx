// Местоположение: src/app/admin/products/[id]/edit/page.tsx
export const dynamic = 'force-dynamic';

import PageContainer from '@/components/layout/PageContainer';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import EditProductForm from '@/components/admin/EditProductForm';

// --- НАЧАЛО ИЗМЕНЕНИЙ: ИСПРАВЛЯЕМ ФУНДАМЕНТАЛЬНУЮ ОШИБКУ ---

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

// 1. Определяем ПРАВИЛЬНЫЙ и простой тип для пропсов страницы
interface EditProductPageProps {
  params: { id: string };
}

// 2. Используем этот тип в сигнатуре функции
export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  // 3. Убираем `await`, так как `params` - это ОБЪЕКТ, а не Promise
  const { id } = params;

  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  const [product, allSizes, allCategories, allTags] = await Promise.all([
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
  ]);

  if (!product) {
    notFound();
  }

  return (
    <main>
      <PageContainer className="py-10">
        <div>
          <Link
            href="/admin/dashboard"
            className="text-sm font-medium text-gray-500 hover:text-gray-800"
          >
            ← Назад к товарам
          </Link>
          <div className="mt-2 md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <div className="text-2xl leading-7 font-bold text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                Редактирование товара
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <EditProductForm
            product={product}
            allSizes={allSizes}
            allCategories={allCategories}
            allTags={allTags}
          />
        </div>
      </PageContainer>
    </main>
  );
}
