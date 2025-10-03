// Местоположение: src/components/admin/edit-product-form/VariantCard.tsx

'use client';

import { ProductWithDetails } from '@/lib/types';
import { Size } from '@prisma/client';
import AddSizeForm from '../AddSizeForm';

type Variant = ProductWithDetails['variants'][0];

interface VariantCardProps {
  variant: Variant;
  allSizes: Size[];
}

export function VariantCard({ variant, allSizes }: VariantCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-semibold text-gray-800">{variant.color}</h3>
      </div>

      <div className="mt-4 border-t pt-4">
        <h4 className="text-sm font-medium text-gray-600">Размеры и остатки</h4>

        <div className="mt-2 space-y-2">
          {variant.sizes.length > 0 ? (
            variant.sizes.map((sizeInfo) => (
              <div
                key={sizeInfo.id}
                className="flex items-center justify-between text-sm"
              >
                <span>
                  Размер:{' '}
                  <span className="font-bold">{sizeInfo.size.value}</span>
                </span>
                <span>
                  Склад: <span className="font-bold">{sizeInfo.stock} шт.</span>
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500">
              У этого варианта еще нет размеров.
            </p>
          )}
        </div>

        <div className="mt-4">
          <AddSizeForm
            productVariantId={variant.id}
            allSizes={allSizes}
            existingSizeIds={variant.sizes.map((s) => s.sizeId)}
          />
        </div>
      </div>
    </div>
  );
}
