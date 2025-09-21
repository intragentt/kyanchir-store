'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import ProductPageHeader from '@/components/layout/ProductPageHeader';
import { useStickyHeader } from '@/context/StickyHeaderContext';

export default function ConditionalHeader() {
  const pathname = usePathname();
  // Получаем статус шапки из нашего "мозга" (контекста)
  const {
    isSearchActive,
    setIsSearchActive,
    isMenuOpen,
    setIsMenuOpen,
    headerStatus, // <-- Эта переменная говорит, когда прятать шапку
  } = useStickyHeader();

  const isProductPage = pathname.startsWith('/product/');
  const isHomePage = pathname === '/';

  if (isProductPage) {
    return <ProductPageHeader />;
  }

  // Логика ТОЛЬКО для главной страницы
  if (isHomePage) {
    // Формируем классы для анимации
    const headerClasses = `
      fixed left-0 right-0 top-0 z-50 w-full bg-white/80 backdrop-blur-md
      transition-transform duration-300 ease-in-out
      ${headerStatus === 'unpinned' ? '-translate-y-full' : 'translate-y-0'}
    `; // ^^^ Вот эта строка и прячет шапку ПОЛНОСТЬЮ при скролле вниз

    return (
      <div className={headerClasses}>
        <Header
          isSearchActive={isSearchActive}
          onSearchToggle={setIsSearchActive}
          isMenuOpen={isMenuOpen}
          onMenuToggle={setIsMenuOpen}
        />
      </div>
    );
  }

  // На ВСЕХ ОСТАЛЬНЫХ страницах (профиль и т.д.) шапка простая и статичная
  return (
    <div className="w-full bg-white">
      <Header
        isSearchActive={isSearchActive}
        onSearchToggle={setIsSearchActive}
        isMenuOpen={isMenuOpen}
        onMenuToggle={setIsMenuOpen}
      />
    </div>
  );
}
