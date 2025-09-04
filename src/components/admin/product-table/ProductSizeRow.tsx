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
    // --- НАЧАЛО ИЗМЕНЕНИЙ: Обновляем ячейки в соответствии с новой шапкой ---
    <tr className="bg-gray-50/50 hover:bg-gray-100">
      {/* 1-я и 2-я колонки: Чекбокс и название размера */}
      <td className="whitespace-nowrap px-6 py-1" colSpan={2}>
        <div className="flex items-center justify-start pl-12">
          <input
            type="checkbox"
            className="mr-4 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-700">{sizeInfo.size.value}</span>
        </div>
      </td>

      {/* 3-я колонка: Пустой спейсер */}
      <td></td>

      {/* 4-я колонка: Склад */}
      <td className="whitespace-nowrap px-6 py-1 text-center text-sm text-gray-500">
        {sizeInfo.stock} шт.
      </td>

      {/* 5-я колонка: Бронь (заглушка) */}
      <td className="whitespace-nowrap px-6 py-1 text-center text-sm text-gray-500">
        0 шт.
      </td>

      {/* 6-я колонка: Пустая ячейка для Цены */}
      <td></td>

      {/* 7-я колонка: Редактировать */}
      <td className="whitespace-nowrap px-6 py-1 text-right text-sm font-medium">
        <a href="#" className="text-indigo-600 hover:text-indigo-900">
          Ред.
        </a>
      </td>
    </tr>
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---
  );
}
