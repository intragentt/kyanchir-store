// Местоположение: src/components/icons/ChevronIcon.tsx
import React from 'react';

interface ChevronIconProps extends React.SVGProps<SVGSVGElement> {
  isOpen: boolean;
}

export default function ChevronIcon({ isOpen, ...props }: ChevronIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      // --- НАЧАЛО ИЗМЕНЕНИЙ ---
      // Добавляем классы для плавной трансформации
      className={`transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-180' : 'rotate-0'}`}
      // --- КОНЕЦ ИЗМЕНЕНИЙ ---
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
