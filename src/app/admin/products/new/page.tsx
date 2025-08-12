// Местоположение: src/app/admin/products/new/page.tsx

import PageContainer from '@/components/layout/PageContainer';
import Link from 'next/link';
// VVV--- ИСПРАВЛЕНИЕ: Импортируем наш новый, правильный компонент ---VVV
import CreateProductForm from '@/components/admin/CreateProductForm';

export default function NewProductPage() {
  return (
    <main>
      <PageContainer className="py-12">
        <div className="mb-8">
          <Link
            href="/admin/dashboard"
            className="hover:text-text-primary text-gray-500"
          >
            ← Назад к списку
          </Link>
        </div>

        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <h1 className="text-text-primary text-2xl font-semibold">
              Создание нового товара
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Шаг 1: Введите основное название и описание товара. <br />
              На следующем шаге вы сможете добавить цвета, фото, цены и размеры.
            </p>
          </div>

          <div className="mt-8">
            {/* VVV--- ИСПРАВЛЕНИЕ: Используем новый компонент ---VVV */}
            <CreateProductForm />
          </div>
        </div>
      </PageContainer>
    </main>
  );
}
