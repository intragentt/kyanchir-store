// Местоположение: src/components/product-details/SizeChart.tsx
'use client';

interface SizeChartProps {
  onClick: () => void;
}

export default function SizeChart({ onClick }: SizeChartProps) {
  return (
    <div>
      {/* --- НАЧАло ИЗМЕНЕНИЙ: Начертание изменено на font-medium --- */}
      <button
        onClick={onClick}
        className="font-body text-left text-base font-medium text-[#272727] underline underline-offset-4"
      >
        Таблица размеров
      </button>
      {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
    </div>
  );
}
