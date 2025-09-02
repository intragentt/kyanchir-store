// Местоположение: /src/components/admin/product-table/VariantRow.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Prisma, Category, Tag } from '@prisma/client';
import { ProductForTable } from '@/app/admin/dashboard/page';
import { EditableCountdownTimer } from './EditableCountdownTimer';
import { formatPrice } from '@/utils/formatPrice';

type VariantData = ProductForTable['variants'][0];

// Props, которые принимает одна строка варианта
interface VariantRowProps {
  variant: VariantData;
  productStatus: ProductForTable['status'];
  onVariantUpdate: (variantId: string, updatedData: Partial<VariantData>) => void;
  // (Здесь будут другие хендлеры, если понадобятся)
}

const formatNumberForInput = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '';
    return num.toString();
};


export function VariantRow({ variant, productStatus, onVariantUpdate }: VariantRowProps) {
  const [isSkuCopied, setIsSkuCopied] = useState(false);
  
  const handleCopySku = (sku: string | null) => {
    if (!sku) return;
    navigator.clipboard.writeText(sku);
    setIsSkuCopied(true);
    setTimeout(() => setIsSkuCopied(false), 2000);
  };
  
  // Здесь мы можем вернуть всю детализированную вёрстку из твоего старого файла.
  // Это упрощенная версия для демонстрации.
  
  const displayPrice = formatPrice(variant.price);
  const displayOldPrice = formatPrice(variant.oldPrice);
   const discountPercent =
    variant.oldPrice && variant.oldPrice > variant.price
      ? Math.round(((variant.oldPrice - variant.price) / variant.oldPrice) * 100)
      : 0;

  return (
    <tr className="bg-gray-50/50">
      <td className="px-1 py-3 text-center w-12 border-l-4 border-indigo-200">
         {/* Checkbox для выбора варианта */}
         <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
      </td>
       {/* Вместо Категорий покажем картинку варианта */}
      <td className="px-6 py-3">
         <Image src={variant.images[0]?.url || '/placeholder.png'} alt={variant.color || ''} width={40} height={40} className="rounded-md object-cover h-10 w-10"/>
      </td>
      <td className="px-6 py-3 text-sm text-gray-800">
          <div>{variant.color || 'Базовый'}</div>
          <div className="text-xs text-gray-500">Размер: {variant.inventory[0]?.size.value || 'N/A'}</div>
      </td>
       {/* Пустые ячейки под шапкой главной строки */}
      <td className="px-6 py-3"> {/* k-coins */}
          <input type="text" defaultValue={variant.bonusPoints || 0} className="w-16 p-1 text-center rounded-md border-gray-300" />
      </td>
      <td className="px-6 py-3"> {/* цена до скидки */}
         <input type="text" defaultValue={variant.oldPrice || ''} className="w-24 p-1 text-center rounded-md border-gray-300" />
      </td>
       <td className="px-6 py-3 text-center">{discountPercent}%</td> {/* скидка */}
       <td className="px-6 py-3"> {/* таймер */}
          {/* <EditableCountdownTimer ... /> */}
       </td>
      <td className="px-6 py-3"> {/* цена */}
         <input type="text" defaultValue={variant.price} className="w-24 p-1 font-bold text-center rounded-md border-gray-300" />
      </td>
    </tr>
  );
}