// Местоположение: src/components/product-details/SizeChart.tsx
'use client';

// ИЗМЕНЕНИЕ 1: Иконка ChevronIcon полностью удалена. Она нам здесь больше не нужна.

// Компонент теперь отвечает только за кнопку для открытия всплывающего окна на мобильных.
interface SizeChartProps {
  onClick: () => void;
  // ИЗМЕНЕНИЕ 2: Пропс `isOpen` удален, так как анимации больше нет.
}

export default function SizeChart({ onClick }: SizeChartProps) {
  return (
    <div>
      <button
        onClick={onClick}
        // ИЗМЕНЕНИЕ 3: Добавили классы для подчеркивания. Убрали flex и gap.
        className="font-body py-4 text-left text-base font-semibold text-gray-800 underline underline-offset-4"
      >
        Таблица размеров
      </button>
      {/* ИЗМЕНЕНИЕ 4: Иконка <ChevronIcon /> удалена из кнопки. */}
    </div>
  );
}
