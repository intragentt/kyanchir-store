// Местоположение: src/components/admin/EditProductForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductWithDetails } from '@/app/admin/products/[id]/edit/page';
import { Size, Category, Tag, ProductVariant, Prisma } from '@prisma/client';

import DetailManager from './edit-product-form/DetailManager';
import CategoryManager from './edit-product-form/CategoryManager';
import { VariantManager } from './edit-product-form/VariantManager'; // Наш новый главный компонент

type ProductStatus = Prisma.ProductGetPayload<{}>['status'];

interface EditProductFormProps {
  product: ProductWithDetails;
  allSizes: Size[];
  allCategories: Category[];
  allTags: Tag[];
}

export default function EditProductForm({
  product,
  allSizes,
  allCategories,
  allTags,
}: EditProductFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // --- НАЧАЛО ИЗМЕНЕНИЙ: ГЛАВНЫЕ СОСТОЯНИЯ ---
  // Теперь у нас есть состояние для данных самого продукта
  const [productData, setProductData] = useState({
    name: product.name,
    status: product.status,
    categories: product.categories,
    tags: product.tags,
    // добавьте другие поля продукта, если они редактируются отдельно
  });

  // И отдельное состояние для массива его вариантов
  const [variants, setVariants] = useState<ProductWithDetails['variants']>(
    product.variants,
  );
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  const handleSave = async (newStatus?: ProductStatus) => {
    setIsSaving(true);
    const finalStatus = newStatus || productData.status;

    // Здесь будет новая логика сборки payload для API
    const payload = {
      ...productData,
      status: finalStatus,
      variants: variants, // Передаем обновленный массив вариантов
    };

    console.log('Saving payload:', payload);

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Ошибка сохранения');
      }

      alert('Сохранено успешно!');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Произошла ошибка');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-3">
        {/* Левая колонка с основной информацией о продукте */}
        <div className="space-y-8 lg:col-span-2">
          <DetailManager
            name={productData.name}
            setName={(name) => setProductData((prev) => ({ ...prev, name }))}
            alternativeNames={[]} // Логику для alternativeNames нужно будет добавить
            setAlternativeNames={() => {}}
          />
          {/* 
            Здесь должны быть другие менеджеры: SkuManager, DescriptionManager, etc.
            Их нужно будет адаптировать, чтобы они работали с `productData`.
          */}
        </div>

        {/* Правая колонка для категорий, тегов и публикации */}
        <div className="space-y-8 lg:col-span-1">
          <CategoryManager
            allCategories={allCategories}
            allTags={allTags}
            selectedCategories={productData.categories}
            setSelectedCategories={(categories) =>
              setProductData((prev) => ({ ...prev, categories }))
            }
            selectedTags={productData.tags}
            setSelectedTags={(tags) =>
              setProductData((prev) => ({ ...prev, tags }))
            }
          />
          {/* Компонент публикации */}
          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-lg font-semibold">Публикация</h2>
            <div className="mt-6 space-y-3">
              <button
                onClick={() => handleSave()}
                disabled={isSaving}
                className="w-full rounded-md bg-[#272727] py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50"
              >
                {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Секция управления вариантами под основной информацией */}
      <div className="mt-12">
        <VariantManager
          variants={variants}
          setVariants={setVariants}
          allSizes={allSizes}
        />
      </div>
    </div>
  );
}
