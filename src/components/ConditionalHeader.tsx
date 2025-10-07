'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import HybridHeader from './HybridHeader';
import ProductPageHeader from '@/components/shared/layout/ProductPageHeader';
import { useAppStore } from '@/store/useAppStore';

export default function ConditionalHeader() {
  const pathname = usePathname();
  const isProductPage =
    pathname.startsWith('/p/') || pathname.startsWith('/product/');
  const isHomePage = pathname === '/';
  // --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем проверку на страницу профиля ---
  const isProfilePage = pathname === '/profile';
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

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

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Рендерим гибридный хедер и для главной, и для профиля ---
  if (isHomePage || isProfilePage) {
    return <HybridHeader />;
  }
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  // На всех остальных страницах (например, каталог) рендерим простую статичную шапку
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
