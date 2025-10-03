// Местоположение: src/components/icons/SortIcon.tsx
import React from 'react';

interface SortIconProps {
  className?: string;
  direction: 'ascending' | 'descending';
}

/**
 * Иконка-стрелка для индикации направления сортировки.
 */
export const SortIcon: React.FC<SortIconProps> = ({ className, direction }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-5 w-5 transition-transform duration-200 ${className} ${direction === 'descending' ? 'rotate-180' : ''}`}
    >
      <path
        fillRule="evenodd"
        d="M10 3a.75.75 0 01.75.75v10.5a.75.75 0 01-1.5 0V3.75A.75.75 0 0110 3z"
        clipRule="evenodd"
      />
      <path
        fillRule="evenodd"
        d="M6.22 6.22a.75.75 0 011.06 0l2.25 2.25a.75.75 0 010 1.06l-2.25 2.25a.75.75 0 11-1.06-1.06L8.44 9 6.22 6.78a.75.75 0 010-1.06z"
        clipRule="evenodd"
        transform="translate(1.5, 0) rotate(90 8.5 8.5)"
      />
    </svg>
  );
};
