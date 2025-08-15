// Местоположение: src/app/admin/products/[id]/edit/page.tsx
export const dynamic = 'force-dynamic';

import PageContainer from '@/components/layout/PageContainer';
import prisma from '@/lib/prisma'; // <-- ИСПРАВЛЕННЫЙ ИМПОРТ
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
            size: true;
          };
        };
      };
      orderBy: { createdAt: 'asc' };
    };
    attributes: true;
    categories: true;
    tags: true; // Добавлена связь с тегами
  };
}>;

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const { id } = await params;

  // --- ИЗМЕНЕНИЕ: Добавлена загрузка тегов ---
  const [product, allSizes, allCategories, allTags] = await Promise.all([
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
        tags: true, // Включаем теги в запрос
      },
    }),
    prisma.size.findMany({
      orderBy: { id: 'asc' },
    }),
    prisma.category.findMany({
      orderBy: { name: 'asc' },
    }),
    prisma.tag.findMany({
      // Загружаем все теги
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
          {/* --- ИЗМЕНЕНИЕ: Передаем теги в компонент --- */}
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
