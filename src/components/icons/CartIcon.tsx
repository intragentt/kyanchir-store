// Местоположение: src/components/icons/CartIcon.tsx
import React from 'react';

export default function CartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M16.3711 5.5L17.46 19.5H4.54004L5.62891 5.5H16.3711Z"
        stroke="currentColor"
        // --- ИЗМЕНЕНИЕ ЗДЕСЬ: Уменьшаем толщину с 1.5 до 1 ---
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.5 8V6C7.5 3.79086 9.067 2 11 2C12.933 2 14.5 3.79086 14.5 6V8"
        stroke="currentColor"
        // --- ИЗМЕНЕНИЕ ЗДЕСЬ: Уменьшаем толщину с 1.5 до 1 ---
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
