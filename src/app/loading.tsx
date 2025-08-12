// Местоположение: src/app/loading.tsx
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation'; // 1. Импортируем хук для получения URL
import ShortLogo from '@/components/icons/ShortLogo';

export default function Loading() {
  const pathname = usePathname(); // 2. Получаем текущий путь, например, "/" или "/catalog"

  // 3. Устанавливаем z-index в зависимости от пути:
  //    - Если это главная страница, z-index будет 155 (выше шапки, у которой 152).
  //    - Если любая другая страница, z-index будет 150 (ниже шапки).
  const zIndexClass = pathname === '/' ? 'z-[155]' : 'z-[150]';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    // 4. Применяем наш динамический z-index к обертке прелоадера
    <div
      className={`fixed inset-0 flex h-screen items-center justify-center overflow-hidden bg-white/70 backdrop-blur-sm ${zIndexClass}`}
    >
      <ShortLogo className="logo-brand-color animate-shine animate-fade-pulse h-256[px] w-auto" />
    </div>
  );
}
