// Местоположение: src/components/admin/edit-product-form/SizeManager.tsx
'use client';

import { Size, Inventory } from '@prisma/client';

interface SizeManagerProps {
  allSizes: Size[];
  inventory: Inventory[];
  onInventoryChange: (sizeId: string, stock: number) => void;
}

export default function SizeManager({
  allSizes,
  inventory,
  onInventoryChange,
}: SizeManagerProps) {
  // Временные данные для сеток, пока мы не создали для них модели
  const allSizeGrids = ['Одежда (S, M, L, XL)', 'Обувь (36-42)'];
  const selectedSizeGrid = allSizeGrids[0]; // Временно выбираем первую

  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="mb-4 text-lg font-semibold text-gray-800">
        Размеры и остатки
      </div>

      <div className="mb-4">
        <label
          htmlFor="size-grid"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Размерная сетка
        </label>
        <select
          id="size-grid"
          value={selectedSizeGrid}
          // Временно отключаем onChange, так как логика смены сеток еще не реализована
          // onChange={(e) => onSizeGridChange(e.target.value)}
          disabled // ИЗМЕНЕНИЕ: Заменяем readOnly на disabled, это правильный атрибут для select
          className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-100 sm:text-sm"
        >
          {allSizeGrids.map((grid) => (
            <option key={grid} value={grid}>
              {grid}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {allSizes.map((size) => {
          const currentStock =
            inventory.find((item) => item.sizeId === size.id)?.stock ?? 0;

          return (
            <div key={size.id}>
              <label
                htmlFor={`size-${size.id}`}
                className="block text-sm font-medium text-gray-700"
              >
                {size.value}
              </label>
              <input
                type="number"
                id={`size-${size.id}`}
                value={currentStock}
                onChange={(e) => {
                  const value = e.target.value;
                  const stockNumber = parseInt(value, 10);
                  onInventoryChange(
                    size.id,
                    isNaN(stockNumber) ? 0 : stockNumber,
                  );
                }}
                placeholder="0"
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
