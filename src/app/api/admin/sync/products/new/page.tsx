// Местоположение: src/app/admin/products/new/page.tsx
import prisma from '@/lib/prisma';
import PageContainer from '@/components/layout/PageContainer';
import CreateProductForm from '@/components/admin/CreateProductForm';

// Эта страница всегда должна запрашивать свежие данные
export const dynamic = 'force-dynamic';

// Получаем данные для формы на сервере
async function getFormData() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
  });
  const statuses = await prisma.status.findMany({
    orderBy: { name: 'asc' },
  });
  return { categories, statuses };
}

export default async function NewProductPage() {
  const { categories, statuses } = await getFormData();

  return (
    <main>
      <PageContainer className="py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 text-2xl font-bold text-gray-800">
            Создание нового товара
          </h1>
          <CreateProductForm categories={categories} statuses={statuses} />
        </div>
      </PageContainer>
    </main>
  );
}
