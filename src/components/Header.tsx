'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BurgerIcon, CartIcon, CloseIcon, Logo, SearchIcon } from './shared/icons';
import { useAppStore } from '@/store/useAppStore';
import { useCartStore, selectCartItemCount } from '@/store/useCartStore';

interface HeaderProps {
  className?: string;
  isSearchActive: boolean;
  onSearchToggle: (isActive: boolean) => void;
  isMenuOpen: boolean;
  onMenuToggle: (isOpen: boolean) => void;
  contentOpacity?: number;
}

export default function Header({
  className = '',
  isSearchActive,
  onSearchToggle,
  isMenuOpen,
  onMenuToggle,
  contentOpacity,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const setFloatingMenuOpen = useAppStore((state) => state.setFloatingMenuOpen);
  const cartItemCount = useCartStore(selectCartItemCount);
  const formattedCartCount = cartItemCount > 99 ? '99+' : cartItemCount.toString();

  return (
    <header className={`w-full bg-white ${className}`}>
      {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Уменьшаем верхний отступ с pt-3 до pt-2 --- */}
      <div
        className="container mx-auto flex h-full items-center justify-between px-4 pb-1.5 pt-2 sm:px-6 lg:px-8 xl:px-12"
        style={{ opacity: contentOpacity ?? 1 }}
      >
        {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
        {!isSearchActive ? (
          <div className="flex w-full items-center justify-between">
            <Link
              href="/"
              onClick={() => onMenuToggle(false)}
              aria-label="На главную"
            >
              <Logo className="logo-brand-color h-5 w-auto" />
            </Link>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => onSearchToggle(true)}
                aria-label="Открыть поиск"
                className="p-2"
              >
                <SearchIcon className="h-6 w-6" />
              </button>
              <Link
                href="/cart"
                aria-label="Открыть корзину"
                className="relative py-2 pl-2 pr-2"
              >
                <CartIcon className="h-6 w-6" />
                {cartItemCount > 0 && (
                  <span className="absolute -right-1 top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-900 px-1 text-xs font-semibold text-white">
                    {formattedCartCount}
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={() => setFloatingMenuOpen(true)}
                aria-label="Открыть меню"
                aria-expanded={isMenuOpen}
                aria-haspopup="menu"
                className="relative z-50 py-2 pl-2"
              >
                <BurgerIcon className="h-7 w-7" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex w-full items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                onSearchToggle(false);
                setSearchQuery('');
              }}
              aria-label="Закрыть поиск"
              className="py-2 pr-2 text-gray-700"
            >
              <CloseIcon className="h-6 w-6" />
            </button>
            <div className="relative flex-grow">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="search"
                placeholder="Поиск по названию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border-none bg-gray-100 py-3 pl-10 pr-4 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
                autoFocus
              />
            </div>
            <Link
              href="/cart"
              aria-label="Открыть корзину"
              className="relative z-50 py-2 pl-2 text-gray-700"
            >
              <CartIcon className="h-6 w-6" />
              {cartItemCount > 0 && (
                <span className="absolute -right-1 top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-900 px-1 text-xs font-semibold text-white">
                  {formattedCartCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setFloatingMenuOpen(true)}
              aria-label="Открыть меню"
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
              className="relative z-50 py-2 pl-2 text-gray-700"
            >
              <BurgerIcon className="h-7 w-7" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
