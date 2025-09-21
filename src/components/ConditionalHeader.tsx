'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import ProductPageHeader from '@/components/layout/ProductPageHeader';
import HybridHeader from './HybridHeader';
// --- ИЗМЕНЕНИЕ: Импортируем useAppStore ---
import { useAppStore } from '@/store/useAppStore';

export default function ConditionalHeader() {
  const pathname = usePathname();
  const isProductPage = pathname.startsWith('/product/');
  const isHomePage = pathname === '/';

  // --- ИЗМЕНЕНИЕ: Получаем состояние из Zustand для обычной шапки ---
  const {
    isSearchActive,
    setSearchActive,
    isFloatingMenuOpen,
    setFloatingMenuOpen,
  } = useAppStore((state) => ({
    isSearchActive: state.isSearchActive,
    setSearchActive: state.setSearchActive,
    isFloatingMenuOpen: state.isFloatingMenuOpen,
    setFloatingMenuOpen: state.setFloatingMenuOpen,
  }));

  if (isProductPage) {
    return <ProductPageHeader />;
  }

  if (isHomePage) {
    return <HybridHeader />;
  }

  // На всех остальных страницах рендерим простую статичную шапку
  return (
    <div className="w-full bg-white">
      <Header
        isSearchActive={isSearchActive}
        onSearchToggle={setSearchActive}
        isMenuOpen={isFloatingMenuOpen}
        onMenuToggle={setFloatingMenuOpen}
      />
    </div>
  );
}
