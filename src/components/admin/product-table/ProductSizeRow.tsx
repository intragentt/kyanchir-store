// Местоположение: /src/components/admin/product-table/ProductSizeRow.tsx
'use client';
import type { Prisma } from '@prisma/client';

// --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем утилитарную функцию для цен ---
const formatPrice = (priceInCents: number | null | undefined) => {
  // Если цены нет, возвращаем прочерк для наглядности
  if (priceInCents === null || priceInCents === undefined) return '—';
  const priceInRubles = priceInCents / 100;

  const formattedNumber = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(priceInRubles);

  return `${formattedNumber} RUB`;
};
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

// Определяем тип для данных о размере, которые приходят в props
type SizeInfo = Prisma.ProductSizeGetPayload<{
  include: { size: true };
}>;

// --- НАЧАЛО ИЗМЕНЕНИЙ: Обновляем props компонента ---
interface ProductSizeRowProps {
  sizeInfo: SizeInfo;
  price: number | null;
  oldPrice: number | null;
}

export function ProductSizeRow({
  sizeInfo,
  price,
  oldPrice,
}: ProductSizeRowProps) {
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
  return (
    // --- НАЧАЛО ИЗМЕНЕНИЙ: Полностью переписываем структуру ячеек ---
    <tr className="bg-gray-50/50 hover:bg-gray-100">
      {/* 1. Пустая ячейка-спейсер для выравнивания */}
      <td className="w-24 px-4 py-1"></td>

      {/* 2. Название размера */}
      <td className="whitespace-nowrap px-6 py-1 text-sm text-gray-700">
        {sizeInfo.size.value}
      </td>

      {/* 3. Склад (фактический остаток) */}
      <td className="w-40 whitespace-nowrap px-6 py-1 text-center text-sm text-gray-500">
        {sizeInfo.stock} шт.
      </td>

      {/* 4. Бронь (заглушка) */}
      <td className="w-40 whitespace-nowrap px-6 py-1 text-center text-sm text-gray-500">
        0 шт.
      </td>

      {/* 5. Старая цена (за 1 шт.) */}
      <td className="w-40 whitespace-nowrap px-6 py-1 text-center text-sm text-gray-500">
        {/* Показываем старую цену, только если она отличается от новой */}
        {oldPrice && oldPrice > (price || 0) ? formatPrice(oldPrice) : '—'}
      </td>

      {/* 6. Цена (за 1 шт.) */}
      <td className="w-40 whitespace-nowrap px-6 py-1 text-center text-sm font-medium text-gray-800">
        {formatPrice(price)}
      </td>

      {/* 7. Пустая ячейка-спейсер для выравнивания */}
      <td className="w-24 px-6 py-1"></td>
    </tr>
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---
  );
}
