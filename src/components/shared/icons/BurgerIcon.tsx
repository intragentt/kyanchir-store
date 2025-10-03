// Местоположение: src/components/icons/BurgerIcon.tsx
import React from 'react';

export default function BurgerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      // --- ИЗМЕНЕНИЕ 1: Приводим viewBox к стандарту 24x24 ---
      viewBox="0 0 24 24"
      // --- ИЗМЕНЕНИЕ 2: Приводим strokeWidth к стандарту 1.5 для этого набора ---
      strokeWidth={1.2}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        // --- ИЗМЕНЕНИЕ 3: Новая, математически выверенная геометрия ---
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
      />
    </svg>
  );
}
