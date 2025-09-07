// Местоположение: src/components/admin/edit-product-form/VariantManager.tsx
'use client';

import { useState } from 'react';
import { ProductWithDetails } from '@/app/admin/products/[id]/edit/page';
import { Size } from '@prisma/client';
import ImageManager from './ImageManager';
import PriceManager from './PriceManager';
import SizeManager from './SizeManager';

type Variant = ProductWithDetails['variants'][0];

interface VariantManagerProps {
  variants: Variant[];
  setVariants: React.Dispatch<React.SetStateAction<Variant[]>>;
  allSizes: Size[];
}

export function VariantManager({
  variants,
  setVariants,
  allSizes,
}: VariantManagerProps) {
  const [activeVariantId, setActiveVariantId] = useState<string | null>(
    variants[0]?.id || null,
  );

  const activeVariant = variants.find((v) => v.id === activeVariantId);

  const handleVariantUpdate = (
    variantId: string,
    updatedData: Partial<Variant>,
  ) => {
    setVariants((prevVariants) =>
      prevVariants.map((v) =>
        v.id === variantId ? { ...v, ...updatedData } : v,
      ),
    );
  };

  if (!activeVariant) {
    return (
      <div>
        Нет вариантов для отображения.{' '}
        <button className="py-3 text-sm text-indigo-600">
          + Добавить вариант
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-6">
      <h2 className="mb-4 text-xl font-bold">Варианты товара</h2>

      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-6">
          {variants.map((variant) => (
            <button
              key={variant.id}
              onClick={() => setActiveVariantId(variant.id)}
              className={`${
                activeVariantId === variant.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              } whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium`}
            >
              {variant.color || 'Основной'}
            </button>
          ))}
          <button className="py-3 text-sm text-indigo-600">
            + Добавить вариант
          </button>
        </nav>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <PriceManager
            price={activeVariant.price}
            oldPrice={activeVariant.oldPrice}
            bonusPoints={activeVariant.bonusPoints}
            discountExpiresAt={activeVariant.discountExpiresAt || null}
            onUpdate={(field, value) =>
              handleVariantUpdate(activeVariant.id, { [field]: value as any })
            }
          />

          <SizeManager
            allSizes={allSizes}
            sizes={activeVariant.sizes}
            onSizeUpdate={(sizeId, stock) => {
              const sizeExists = activeVariant.sizes.some(
                (s) => s.sizeId === sizeId,
              );

              let newSizes;
              if (sizeExists) {
                newSizes = activeVariant.sizes.map((s) =>
                  s.sizeId === sizeId ? { ...s, stock } : s,
                );
              } else {
                const sizeData = allSizes.find((s) => s.id === sizeId);
                if (!sizeData) return;

                // --- НАЧАЛО ИЗМЕНЕНИЙ: Заменяем moyskladId на moySkladHref ---
                newSizes = [
                  ...activeVariant.sizes,
                  {
                    id: `new_${sizeId}_${Date.now()}`,
                    stock: stock,
                    sizeId: sizeId,
                    size: sizeData,
                    productVariantId: activeVariant.id,
                    moySkladHref: null, // Используем новое поле
                  },
                ];
                // --- КОНЕЦ ИЗМЕНЕНИЙ ---
              }
              handleVariantUpdate(activeVariant.id, { sizes: newSizes as any }); // 'as any' для упрощения, т.к. TS ругается на тип
            }}
          />
        </div>
        <div className="lg:col-span-1">
          <ImageManager
            images={activeVariant.images}
            onImageOrderChange={(reorderedImages) =>
              handleVariantUpdate(activeVariant.id, { images: reorderedImages })
            }
            onImageAdd={() => {}}
            onImageRemove={(imageId) => {
              const newImages = activeVariant.images.filter(
                (img) => img.id !== imageId,
              );
              handleVariantUpdate(activeVariant.id, { images: newImages });
            }}
          />
        </div>
      </div>
    </div>
  );
}
