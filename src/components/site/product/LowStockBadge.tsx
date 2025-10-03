// Местоположение: src/components/product-details/LowStockBadge.tsx
'use client';

interface LowStockBadgeProps {
  stock: number;
}

export default function LowStockBadge({ stock }: LowStockBadgeProps) {
  return (
    // --- НАЧАЛО ИЗМЕНЕНИЙ: Увеличен вертикальный отступ (py-0.5 -> py-1) ---
    <div className="absolute top-1 right-0 z-10 flex translate-x-[15%] items-center rounded bg-[#E06F6F] px-1.5 py-1 text-[10px] leading-none font-bold whitespace-nowrap text-white sm:px-2 sm:py-1 sm:text-xs">
      {stock} шт
    </div>
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---
  );
}
