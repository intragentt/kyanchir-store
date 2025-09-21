'use client';

import Header from '@/components/Header';
import { useStickyHeader } from '@/context/StickyHeaderContext';

export default function HomePageHeader() {
  // Этот компонент использует всю "умную" логику из контекста
  const {
    isSearchActive,
    setIsSearchActive,
    isMenuOpen,
    setIsMenuOpen,
    headerStatus,
  } = useStickyHeader();

  // И применяет классы для анимации
  const headerClasses = `
    fixed left-0 right-0 top-0 z-50 w-full bg-white/80 backdrop-blur-md
    transition-transform duration-300 ease-in-out
    ${headerStatus === 'unpinned' ? '-translate-y-full' : 'translate-y-0'}
  `;

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