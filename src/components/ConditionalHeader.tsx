'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import ProductPageHeader from '@/components/layout/ProductPageHeader';
import HybridHeader from './HybridHeader'; // <-- Импортируем наш новый гибридный хедер

export default function ConditionalHeader() {
  const pathname = usePathname();
  const isProductPage = pathname.startsWith('/product/');
  const isHomePage = pathname === '/';

  if (isProductPage) {
    return <ProductPageHeader />;
  }

  // Если это главная страница, рендерим наш новый гибридный хедер
  if (isHomePage) {
    return <HybridHeader />;
  }

  // На всех остальных страницах (профиль, каталог) рендерим простой статичный хедер
  return (
    <div className="w-full bg-white">
      {/* Для статичного хедера нужно передать пропсы, но сейчас он не используется,
          так как AppCore его не рендерит. Оставляем для ясности. */}
      <Header
        isSearchActive={false}
        onSearchToggle={() => {}}
        isMenuOpen={false}
        onMenuToggle={() => {}}
      />
    </div>
  );
}
