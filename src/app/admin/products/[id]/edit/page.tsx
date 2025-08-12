// Местоположение: src/app/admin/products/[id]/edit/page.tsx
export const dynamic = 'force-dynamic';

import PageContainer from '@/components/layout/PageContainer';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import EditProductForm from '@/components/admin/EditProductForm';
import { Prisma } from '@prisma/client';

export type ProductWithDetails = Prisma.ProductGetPayload<{
  include: {
    alternativeNames: true;
    variants: {
      include: {
        images: true;
        inventory: {
          include: {
            size: true,
          };
        };
      };
      orderBy: { createdAt: 'asc' };
    };
    attributes: true;
    categories: true;
  };
}>;

interface EditProductPageProps {
  params: { id: string };
}

// ИЗМЕНЕНИЕ: Мы извлекаем { id } прямо из params в сигнатуре функции
export default async function EditProductPage({
  params: { id },
}: EditProductPageProps) {
  const [product, allSizes, allCategories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        alternativeNames: true,
        variants: {
          include: {
            images: true,
            inventory: {
              include: {
                size: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        attributes: true,
        categories: true,
      },
    }),
    prisma.size.findMany({
      orderBy: { id: 'asc' },
    }),
    prisma.category.findMany({
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
          />
        </div>
      </PageContainer>
    </main>
  );
}