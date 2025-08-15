// Местоположение: src/components/admin/edit-product-form/SizeManager.tsx
'use client';

import { Inventory, Size } from '@prisma/client';

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
  // Временно используем статичные данные, пока не будет модели для сеток
  const allSizeGrids = ['Одежда (S, M, L, XL)', 'Обувь (36-42)'];
  // Временно всегда выбираем первую сетку
  const selectedSizeGrid = allSizeGrids[0];

  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="text-lg font-semibold text-gray-800">
        Размеры и остатки
      </div>

      {/* VVV--- ВОЗВРАЩАЕМ БЛОК С ВЫБОРОМ СЕТКИ ---VVV */}
      <div className="mt-4">
        <label
          htmlFor="size-grid"
          className="block text-sm font-medium text-gray-700"
        >
          Размерная сетка
        </label>
        <select
          id="size-grid"
          value={selectedSizeGrid}
          // Логика смены сеток пока не реализована, поэтому список неактивен
          disabled
          className="mt-1 block w-full max-w-xs rounded-md border-gray-300 bg-gray-50 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-opacity-50 sm:text-sm"
        >
          {allSizeGrids.map((grid) => (
            <option key={grid} value={grid}>
              {grid}
            </option>
          ))}
        </select>
      </div>

      {/* VVV--- ВОЗВРАЩАЕМ ПОЛЯ ДЛЯ ВВОДА ОСТАТКОВ ---VVV */}
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        {allSizes.map((size) => {
          // Ищем текущий остаток для этого размера
          const currentStock =
            inventory.find((item) => item.sizeId === size.id)?.stock ?? '';

          return (
            <div key={size.id}>
              <label
                htmlFor={`stock-${size.id}`}
                className="block text-sm font-medium text-gray-700"
              >
                Размер: <span className="font-bold">{size.value}</span>
              </label>
              <input
                type="number"
                id={`stock-${size.id}`}
                name={`stock-${size.id}`}
                min="0"
                value={currentStock}
                onChange={(e) => {
                  // При изменении вызываем функцию из родителя
                  const newStock = parseInt(e.target.value, 10) || 0;
                  onInventoryChange(size.id, newStock);
                }}
                placeholder="0"
                className="user-select-text mt-1 block w-full rounded-md border-gray-300 bg-gray-50 p-2 text-center shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}