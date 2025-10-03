// Местоположение: src/components/icons/HeartIcon.tsx
import React from 'react';

interface HeartIconProps extends React.SVGProps<SVGSVGElement> {
  filled?: boolean;
}

export default function HeartIcon({
  filled = false,
  ...props
}: HeartIconProps) {
  // ИЗМЕНЕНИЕ 1: Мы больше не управляем цветом через style.
  // Цвет будет наследоваться благодаря 'currentColor'.
  const fillColor = filled ? 'currentColor' : 'none';

  return (
    // ИЗМЕНЕНИЕ 2: Убираем fill, width и height. Увеличиваем viewBox для запаса.
    <svg viewBox="-1 -1 19 19" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M8.8916 3.81445C10.5771 2.11697 13.2772 2.06353 15.0273 3.65527L15.1934 3.81445C16.0645 4.69192 16.5 5.84254 16.5 6.99414C16.5 8.07391 16.1172 9.15247 15.3516 10.0049L15.1934 10.1719L11.043 14.3525L11.0205 14.375C9.63235 15.7533 7.36931 15.7541 5.98047 14.377H5.98145L5.95703 14.3525L1.80664 10.1719C0.0648119 8.41747 0.0645224 5.57031 1.80664 3.81445C2.67766 2.93727 3.81671 2.5 4.95801 2.5C6.09931 2.50002 7.23837 2.93724 8.10938 3.81445L8.14551 3.85156L8.50098 4.20898L8.85547 3.85156L8.8916 3.81445Z"
        fill={fillColor}
        // ИЗМЕНЕНИЕ 3: Цвет обводки теперь тоже 'currentColor'
        stroke="currentColor"
        // ИЗМЕНЕНИЕ 4: Толщина обводки теперь 2, как у других иконок
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
