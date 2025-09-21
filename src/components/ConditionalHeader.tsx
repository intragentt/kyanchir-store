'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import ProductPageHeader from '@/components/layout/ProductPageHeader';
import { useStickyHeader } from '@/context/StickyHeaderContext';

// --- НАЧАЛО ИЗМЕНЕНИЙ: Полностью переписанный и упрощенный компонент ---
export default function ConditionalHeader() {
  const pathname = usePathname();
  const { isSearchActive, setIsSearchActive, isMenuOpen, setIsMenuOpen } =
    useStickyHeader();

  const isProductPage = pathname.startsWith('/product/');

  // Логика осталась прежней: для страницы товара - своя шапка, для всех остальных - общая.
  if (isProductPage) {
    // Вся сложная логика скролла для страницы товара удалена,
    // теперь здесь можно рендерить ProductPageHeader напрямую.
    // Если для него нужна "липкость", ее нужно реализовать аналогично
    // обертке <div className="sticky..."> ниже.
    return <ProductPageHeader />;
  }

  // Для всех остальных страниц (включая главную) мы рендерим ОДИН И ТОТ ЖЕ Header.
  // Он НЕ фиксированный и НЕ липкий. Он просто находится вверху страницы.
  return (
    <Header
      isSearchActive={isSearchActive}
      onSearchToggle={setIsSearchActive}
      isMenuOpen={isMenuOpen}
      onMenuToggle={setIsMenuOpen}
    />
  );
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---
