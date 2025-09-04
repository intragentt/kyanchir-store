// Местоположение: /src/components/admin/product-table/ProductSizeRow.tsx
'use client';
import type { Prisma } from '@prisma/client';

// Определяем тип для данных о размере, которые приходят в props
type SizeInfo = Prisma.ProductSizeGetPayload<{
  include: { size: true };
}>;

interface ProductSizeRowProps {
  sizeInfo: SizeInfo;
}

export function ProductSizeRow({ sizeInfo }: ProductSizeRowProps) {
  return (
    // --- НАЧАЛО ИЗМЕНЕНИЙ: Убираем "Размер:" и добавляем ячейки ---
    <tr className="bg-gray-50/50 hover:bg-gray-100">
      <td className="flex w-24 items-center justify-end px-4 py-1">
        <div className="pr-1">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
        </div>
      </td>
      <td className="whitespace-nowrap px-6 py-1">
        <div className="pl-12 text-sm text-gray-700">{sizeInfo.size.value}</div>
      </td>
      <td></td>
      <td></td>
      <td className="whitespace-nowrap px-6 py-1 text-center text-sm text-gray-500">
        {sizeInfo.stock} шт.
      </td>
      {/* Пустые ячейки-заглушки для колонок БРОНИ */}
      <td></td>
      <td></td>
      <td className="w-40 px-6 py-1"></td>
      <td className="w-24 whitespace-nowrap px-6 py-1 text-right text-sm font-medium">
        <a href="#" className="text-indigo-600 hover:text-indigo-900">
          Ред.
        </a>
      </td>
    </tr>
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---
  );
}
