// Местоположение: src/app/admin/products/[id]/edit/page.tsx
export const dynamic = 'force-dynamic';

import PageContainer from '@/components/layout/PageContainer';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import EditProductForm from '@/components/admin/EditProductForm';

// --- НАЧАЛО ИЗМЕНЕНИЙ: ИСПОЛЬЗУЕМ СТАНДАРТНЫЙ TYPESCRIPT ДЛЯ ТИПОВ ---

// 1. Создаем async функцию, которая получает наш продукт со всеми деталями
async function getProductWithDetails(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      status: true, // Не забываем статус!
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

// 2. Выводим тип из того, что возвращает функция.
// NonNullable<> используется на случай, если findUnique вернет null.
export type ProductWithDetails = NonNullable<
  Awaited<ReturnType<typeof getProductWithDetails>>
>;

interface EditProductPageProps {
  params: { id: string };
}

// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = params;

  const [product, allSizes, allCategories, allTags] = await Promise.all([
    getProductWithDetails(id), // Используем нашу новую функцию
    prisma.size.findMany({
      orderBy: { value: 'asc' }, // Лучше сортировать по значению
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
