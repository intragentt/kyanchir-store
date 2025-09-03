// Местоположение: src/components/admin/EditProductForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductWithDetails } from '@/app/admin/products/[id]/edit/page';
import { Size, Category, Tag, Status } from '@prisma/client';

import DetailManager from './edit-product-form/DetailManager';
import CategoryManager from './edit-product-form/CategoryManager';
import { VariantManager } from './edit-product-form/VariantManager';

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

  const [productData, setProductData] = useState({
    name: product.name,
    sku: product.sku,
    status: product.status,
    categories: product.categories,
    tags: product.tags,
    alternativeNames: product.alternativeNames,
    attributes: product.attributes,
  });

  const [variants, setVariants] = useState<ProductWithDetails['variants']>(
    product.variants,
  );

  const handleSave = async (newStatus?: Status) => {
    setIsSaving(true);
    const finalStatus = newStatus || productData.status;

    const payload = {
      ...productData,
      status: finalStatus,
      variants: variants,
    };

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка сохранения: ${errorText}`);
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
        <div className="space-y-8 lg:col-span-2">
          {/* --- НАЧАЛО ИЗМЕНЕНИЙ: ИСПРАВЛЯЕМ ОПЕЧАТКУ --- */}
          <DetailManager
            name={productData.name}
            setName={(name) => setProductData((prev) => ({ ...prev, name }))}
            alternativeNames={productData.alternativeNames}
            setAlternativeNames={(altNames) =>
              setProductData((prev) => ({ ...prev, altNames: altNames }))
            }
          />
          {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
        </div>

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
          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-lg font-semibold">Публикация</h2>
            <div className="mt-4">
              <span className="text-sm font-medium text-gray-900">
                Текущий статус:{' '}
              </span>
              <span className="font-bold">{productData.status.name}</span>
            </div>
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
