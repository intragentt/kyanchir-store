'use client'; // Добавляем 'use client' на всякий случай, для иконок это хорошая практика

import React from 'react';

// --- НАЧАЛО ИЗМЕНЕНИЙ: Меняем экспорт на именованный (named export) ---
export const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// Default export больше не нужен
export default CheckIcon;
