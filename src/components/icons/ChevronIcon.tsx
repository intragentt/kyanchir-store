// Местоположение: /src/components/icons/ChevronIcon.tsx
import React from 'react';

interface ChevronIconProps extends React.SVGProps<SVGSVGElement> {
  isOpen: boolean;
  // --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем опцию направления ---
  direction?: 'down' | 'right';
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
}

export default function ChevronIcon({
  isOpen,
  direction = 'down', // По умолчанию стрелка смотрит вниз
  ...props
}: ChevronIconProps) {
  // --- НАЧАЛО ИЗМЕНЕНИЙ: "Умная" логика поворота ---
  const rotationClass =
    direction === 'down'
      ? // Логика для стрелки ВНИЗ/ВВЕРХ
        isOpen
        ? 'rotate-180' // Открыто (вверх)
        : 'rotate-0' // Закрыто (вниз)
      : // Логика для стрелки ВПРАВО/ВНИЗ
        isOpen
        ? 'rotate-0' // Открыто (вниз)
        : '-rotate-90'; // Закрыто (вправо)
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5} // Используем более изящную толщину
      stroke="currentColor"
      className={`transition-transform duration-300 ease-in-out ${rotationClass}`}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
      />
    </svg>
  );
}
