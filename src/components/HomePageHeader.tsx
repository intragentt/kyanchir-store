'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import ProductPageHeader from '@/components/layout/ProductPageHeader';
import { useStickyHeader } from '@/context/StickyHeaderContext';

export default function ConditionalHeader() {
  const pathname = usePathname();
  const {
    isSearchActive,
    setIsSearchActive,
    isMenuOpen,
    setIsMenuOpen,
    headerStatus,
  } = useStickyHeader();

  const isProductPage = pathname.startsWith('/product/');
  const isHomePage = pathname === '/';

  if (isProductPage) {
    return <ProductPageHeader />;
  }

  if (isHomePage) {
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

  // На всех остальных страницах этот компонент ничего не рендерит
  return null;
}
