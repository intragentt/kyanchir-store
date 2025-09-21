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
    // Для страницы товара по-прежнему используется своя логика без фиксации
    return <ProductPageHeader />;
  }

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Возвращаем "липкую" обертку для всех остальных страниц ---
  return (
    <div className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md">
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
