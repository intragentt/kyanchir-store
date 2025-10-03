// Местоположение: src/components/admin/EditProductForm.tsx

'use client';

import { ProductWithDetails } from '@/lib/types';
import { Size, Category, Tag, Status } from '@prisma/client';
import { Toaster } from 'react-hot-toast';
import { ProductBasicDetailsForm } from './edit-product-form/ProductBasicDetailsForm';
import { ProductVariantsManager } from './edit-product-form/ProductVariantsManager';

interface EditProductFormProps {
  product: ProductWithDetails;
  allSizes: Size[];
  allCategories: Category[];
  allTags: Tag[];
  allStatuses: Status[];
}

export default function EditProductForm({
  product,
  allStatuses,
  allSizes,
}: EditProductFormProps) {
  return (
    <div className="space-y-10">
      <Toaster position="top-center" />

      <ProductBasicDetailsForm product={product} allStatuses={allStatuses} />

      <ProductVariantsManager product={product} allSizes={allSizes} />
    </div>
  );
}
