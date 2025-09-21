'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import ProductPageHeader from '@/components/layout/ProductPageHeader';
import { useStickyHeader } from '@/context/StickyHeaderContext';

export default function ConditionalHeader() {
  const pathname = usePathname();
  // --- НАЧАЛО ИЗМЕНЕНИЙ: Получаем статус шапки из контекста ---
  const {
    isSearchActive,
    setIsSearchActive,
    isMenuOpen,
    setIsMenuOpen,
    headerStatus, // <-- Получаем состояние
  } = useStickyHeader();
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  const isProductPage = pathname.startsWith('/product/');
  const isHomePage = pathname === '/';

  if (isProductPage) {
    return <ProductPageHeader />;
  }

  if (isHomePage) {
    // --- НАЧАЛО ИЗМЕНЕНИЙ: Создаем динамические классы для анимации ---
    const headerClasses = `
      fixed left-0 right-0 top-0 z-50 w-full bg-white/80 backdrop-blur-md
      transition-transform duration-300 ease-in-out
      ${headerStatus === 'unpinned' ? '-translate-y-full' : 'translate-y-0'}
    `;
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---

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

  // На всех остальных страницах (профиль, каталог и т.д.) используем обычную статичную шапку
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
