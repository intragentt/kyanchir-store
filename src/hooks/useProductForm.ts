// Местоположение: src/hooks/useProductForm.ts

import { useState, useTransition } from 'react';
import { toast } from 'react-hot-toast';
import { ProductWithDetails } from '@/lib/types';
import { Status } from '@prisma/client';

interface ProductFormData {
  name: string;
  description: string;
  statusId: string;
}

export function useProductForm(
  product: ProductWithDetails,
  allStatuses: Status[],
) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: product.name,
    description: product.description || '',
    statusId: product.statusId,
  });
  const [isPending, startTransition] = useTransition();

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const updateProduct = () => {
    startTransition(async () => {
      const toastId = toast.loading('Сохраняем детали...');

      try {
        const response = await fetch(`/api/products/${product.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            article: product.article,
            variants: product.variants,
            categories: product.categories.map((c) => ({ id: c.id })),
            tags: product.tags.map((t) => ({ id: t.id })),
            attributes: product.attributes,
            alternativeNames: product.alternativeNames,
            status: allStatuses.find((s) => s.id === formData.statusId),
          }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(errorData || 'Ошибка при сохранении');
        }

        toast.success('Детали сохранены!', { id: toastId });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Неизвестная ошибка',
          { id: toastId },
        );
      }
    });
  };

  return {
    formData,
    isPending,
    handleInputChange,
    updateProduct,
  };
}
