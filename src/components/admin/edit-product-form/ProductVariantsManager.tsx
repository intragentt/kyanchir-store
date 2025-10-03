// Местоположение: src/components/admin/edit-product-form/ProductVariantsManager.tsx

'use client';

import { ProductWithDetails } from '@/lib/types';
import { Size } from '@prisma/client';
import AddVariantForm from '../AddVariantForm';
import AddSizeForm from '../AddSizeForm';
import { VariantCard } from './VariantCard';

interface ProductVariantsManagerProps {
  product: ProductWithDetails;
  allSizes: Size[];
}

export function ProductVariantsManager({
  product,
  allSizes,
}: ProductVariantsManagerProps) {
  return (
    <div className="space-y-6 rounded-lg bg-white p-8 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Варианты (цвета)</h2>

      <div className="space-y-6">
        {product.variants.length > 0 ? (
          product.variants.map((variant) => (
            <VariantCard
              key={variant.id}
              variant={variant}
              allSizes={allSizes}
            />
          ))
        ) : (
          <p className="text-sm text-gray-500">
            У этого товара еще нет вариантов.
          </p>
        )}
      </div>

      <div className="border-t pt-6">
        <h3 className="text-md font-medium text-gray-800">
          Добавить новый вариант
        </h3>
        <div className="mt-4">
          <AddVariantForm productId={product.id} />
        </div>
      </div>
    </div>
  );
}
