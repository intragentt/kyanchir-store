// Местоположение: src/components/admin/ProductTable.tsx
'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/utils/formatPrice';
import { VariantWithProductInfo } from '@/app/admin/dashboard/page';

// --- ИКОНКИ ДЛЯ НОВЫХ ФУНКЦИЙ ---
const CopyIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path d="M7 3a1 1 0 011-1h6a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 01-.707.293H3a1 1 0 01-1-1V4a1 1 0 011-1h4zM6 5v7h4.586l6.414-6.414V5H6z" />
  </svg>
);
const UploadIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
      clipRule="evenodd"
    />
  </svg>
);
const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
      clipRule="evenodd"
    />
  </svg>
);

interface ProductTableProps {
  variants: VariantWithProductInfo[];
}

export default function ProductTable({ variants }: ProductTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Здесь будет логика для статуса и удаления
  // ...

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden border-b border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {/* VVV--- НОВАЯ ШАПКА ТАБЛИЦЫ ---VVV */}
              <tr>
                <th colSpan={5} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-x-4">
                      <div className="flex items-center gap-x-2">
                        <button className="flex items-center gap-x-1 rounded-md border bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                          <UploadIcon className="h-4 w-4" /> Загрузить CSV
                        </button>
                        <button className="flex items-center gap-x-1 rounded-md border bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                          <DownloadIcon className="h-4 w-4" /> Выгрузить CSV
                        </button>
                      </div>
                    </div>
                    <Link
                      href="/admin/products/new"
                      className="hover:bg-opacity-80 rounded-md bg-[#272727] px-4 py-2 text-sm font-medium text-white shadow-sm"
                    >
                      + Создать товар
                    </Link>
                  </div>
                </th>
              </tr>
              <tr>
                <th
                  scope="col"
                  className="w-2/5 px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                >
                  Товар
                </th>
                <th
                  scope="col"
                  className="w-1/5 px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                >
                  Артикул
                </th>
                <th
                  scope="col"
                  className="w-1/5 px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                >
                  Цена
                </th>
                <th
                  scope="col"
                  className="w-1/5 px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                >
                  Статус
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Действия</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant, variantIdx) => (
                <tr
                  key={variant.id}
                  className={variantIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
                    <div className="flex items-center">
                      <Image
                        src={variant.images[0]?.url || '/placeholder.png'}
                        alt={variant.product.name}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                      <div className="ml-4">
                        <div>{variant.product.name}</div>
                        {/* VVV--- ОСТАТКИ ВМЕСТО ЦВЕТА ---VVV */}
                        <div className="font-mono text-xs text-gray-500">
                          S:{' '}
                          {variant.product.variants
                            .find((v) => v.color === variant.color)
                            ?.inventory.find((i) => i.size.value === 'S')
                            ?.stock ?? 0}
                          , M:{' '}
                          {variant.product.variants
                            .find((v) => v.color === variant.color)
                            ?.inventory.find((i) => i.size.value === 'M')
                            ?.stock ?? 0}
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* VVV--- АРТИКУЛ С КОПИРОВАНИЕМ ---VVV */}
                  <td className="px-6 py-4 font-mono text-xs whitespace-nowrap text-gray-500">
                    <div className="flex items-center gap-x-2">
                      <span>{variant.id.slice(0, 8)}...</span>
                      <button
                        onClick={() => handleCopy(variant.id)}
                        title="Копировать ID"
                      >
                        <CopyIcon
                          className={`h-4 w-4 ${copiedId === variant.id ? 'text-green-500' : 'text-gray-400'}`}
                        />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-800">
                    {formatPrice(variant.price)?.value} ₽
                  </td>
                  {/* VVV--- СТАТУС С ПЕРЕКЛЮЧАТЕЛЕМ ---VVV */}
                  <td className="px-6 py-4 text-sm whitespace-nowrap">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs leading-5 font-semibold ${variant.product.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                    >
                      {variant.product.status === 'PUBLISHED'
                        ? 'Опубликован'
                        : 'Черновик'}
                    </span>
                  </td>
                  {/* VVV--- РЕДАКТИРОВАНИЕ И УДАЛЕНИЕ ---VVV */}
                  <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
                    <Link
                      href={`/admin/products/${variant.productId}/edit`}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Редактировать
                    </Link>
                    {variant.product.status !== 'PUBLISHED' && (
                      <button className="ml-4 font-semibold text-red-600 hover:text-red-800">
                        Удалить
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
