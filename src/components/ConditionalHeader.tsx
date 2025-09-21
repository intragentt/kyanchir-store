'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import ProductPageHeader from '@/components/layout/ProductPageHeader';
import { useStickyHeader } from '@/context/StickyHeaderContext';
import HomePageHeader from './HomePageHeader'; // <-- Импортируем наш новый компонент

export default function ConditionalHeader() {
  const pathname = usePathname();
  // Контекст все еще нужен для передачи пропсов в обычную шапку
  const { isSearchActive, setIsSearchActive, isMenuOpen, setIsMenuOpen } =
    useStickyHeader();

  const isProductPage = pathname.startsWith('/product/');
  const isHomePage = pathname === '/';

  if (isProductPage) {
    return <ProductPageHeader />;
  }

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Используем новый изолированный компонент ---
  // Если это главная страница, рендерим "умную" шапку
  if (isHomePage) {
    return <HomePageHeader />;
  }

  // На всех остальных страницах рендерим простую статичную шапку
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
