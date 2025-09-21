'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import ProductPageHeader from '@/components/layout/ProductPageHeader';
import { useStickyHeader } from '@/context/StickyHeaderContext';

export default function ConditionalHeader() {
  const pathname = usePathname();
  const { isSearchActive, setIsSearchActive, isMenuOpen, setIsMenuOpen } =
    useStickyHeader();

  const isProductPage = pathname.startsWith('/product/');

  if (isProductPage) {
    return <ProductPageHeader />;
  }

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Заменяем sticky на fixed для абсолютной фиксации ---
  return (
    <div className="fixed left-0 right-0 top-0 z-50 w-full bg-white/80 backdrop-blur-md">
      <Header
        isSearchActive={isSearchActive}
        onSearchToggle={setIsSearchActive}
        isMenuOpen={isMenuOpen}
        onMenuToggle={setIsMenuOpen}
      />
    </div>
  );
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
}
