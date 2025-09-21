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
  // --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем проверку на главную страницу ---
  const isHomePage = pathname === '/';
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  if (isProductPage) {
    return <ProductPageHeader />;
  }

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Рендерим шапку в зависимости от страницы ---
  // Если это главная страница, используем "умную" прилипающую шапку
  if (isHomePage) {
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
  }

  // На всех остальных страницах (профиль, каталог и т.д.) используем обычную статичную шапку,
  // которая прокручивается вместе с контентом и не "прыгает" в Safari.
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
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
}
