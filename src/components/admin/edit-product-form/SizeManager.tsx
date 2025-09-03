// Местоположение: src/components/admin/edit-product-form/SizeManager.tsx
'use client';

// --- НАЧАЛО ИЗМЕНЕНИЙ: ИМПОРТИРУЕМ НУЖНЫЕ ТИПЫ ---
import { Prisma, Size } from '@prisma/client';

// Определяем тип для одного элемента массива размеров, который приходит из родителя
type ProductSizeWithDetails = Prisma.ProductSizeGetPayload<{
  include: {
    size: true;
  };
}>;
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

interface SizeManagerProps {
  allSizes: Size[];
  // --- НАЧАЛО ИЗМЕНЕНИЙ: МЕНЯЕМ `Inventory[]` НА НОВЫЙ ТИП И НАЗВАНИЯ ---
  sizes: ProductSizeWithDetails[];
  onSizeUpdate: (sizeId: string, stock: number) => void;
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
}

export default function SizeManager({
  allSizes,
  // --- НАЧАЛО ИЗМЕНЕНИЙ: ИСПОЛЬЗУЕМ НОВЫЕ ПРОПСЫ ---
  sizes,
  onSizeUpdate,
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
}: SizeManagerProps) {
  // Эта логика остается для будущего
  const allSizeGrids = ['Одежда (S, M, L, XL)', 'Обувь (36-42)'];
  const selectedSizeGrid = allSizeGrids[0];

  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="text-lg font-semibold text-gray-800">
        Размеры и остатки
      </div>

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
          disabled
          className="disabled:bg-opacity-50 mt-1 block w-full max-w-xs rounded-md border-gray-300 bg-gray-50 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:cursor-not-allowed sm:text-sm"
        >
          {allSizeGrids.map((grid) => (
            <option key={grid} value={grid}>
              {grid}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        {allSizes.map((size) => {
          // --- НАЧАЛО ИЗМЕНЕНИЙ: ИЩЕМ ОСТАТОК В НОВОМ МАССИВЕ `sizes` ---
          const currentStock =
            sizes.find((item) => item.sizeId === size.id)?.stock ?? '';
          // --- КОНЕЦ ИЗМЕНЕНИЙ ---

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
                  // --- НАЧАЛО ИЗМЕНЕНИЙ: ВЫЗЫВАЕМ НОВУЮ ФУНКЦИЮ `onSizeUpdate` ---
                  const newStock = parseInt(e.target.value, 10) || 0;
                  onSizeUpdate(size.id, newStock);
                  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
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
