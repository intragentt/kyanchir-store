// Местоположение: src/components/layout/StickyHeader.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from '../icons/Logo';
import CloseIcon from '../icons/CloseIcon';
import BurgerIcon from '../icons/BurgerIcon';
import SearchIcon from '../icons/SearchIcon';
import DesktopNav from '../header/DesktopNav';
import MobileNav from '../header/MobileNav';
// --- НАЧАЛО ИЗМЕНЕНИЙ ---
import { useAppStore } from '@/store/useAppStore'; // Импортируем наш "сейф"
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

interface StickyHeaderProps {
  isVisible: boolean;
  isTransitionEnabled: boolean;
}

export default function StickyHeader({
  isVisible,
  isTransitionEnabled,
}: StickyHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // --- НАЧАЛО ИЗМЕНЕНИЙ ---
  const user = useAppStore((state) => state.user); // Достаем пользователя из "сейфа"
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalWidth = document.body.style.width;

    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
    };
  }, [isMenuOpen]);

  const headerClasses = [
    'fixed top-0 right-0 left-0 z-152 w-full border-b border-gray-200 bg-white',
    'will-change-transform',
    isTransitionEnabled ? 'transition-transform duration-300 ease-in-out' : '',
    isVisible ? 'transform-none' : '-translate-y-full',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <header className={headerClasses}>
        <div className="container mx-auto flex h-full items-center justify-between px-4 py-4 sm:px-6 lg:px-8 xl:px-12">
          {!isSearchActive && (
            <Link
              href="/"
              onClick={() => setIsMenuOpen(false)}
              aria-label="На главную"
              className="-mt-1"
            >
              <Logo className="logo-brand-color h-[10px] w-auto" />
            </Link>
          )}

          <div className="hidden items-center space-x-6 lg:flex">
            {/* --- НАЧАЛО ИЗМЕНЕНИЙ --- */}
            <DesktopNav user={user} />
            {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
          </div>

          <div className="flex items-center space-x-2 lg:hidden">
            {isSearchActive ? (
              <>
                <SearchIcon className="mr-2 h-6 w-6 text-gray-700" />
                <input
                  type="search"
                  className="flex-grow border-b border-gray-300 focus:outline-none"
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <button
                  onClick={() => {
                    setIsSearchActive(false);
                    setSearchQuery('');
                  }}
                  className="ml-2 text-sm text-gray-600"
                >
                  Отмена
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsSearchActive(true)}
                  aria-label="Поиск"
                  className="relative z-50 p-2 text-gray-700"
                >
                  <SearchIcon className="h-6 w-6" />
                </button>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="relative z-50 mt-[1px] p-[2px] text-gray-700"
                >
                  {isMenuOpen ? (
                    <CloseIcon className="h-7 w-7" />
                  ) : (
                    <BurgerIcon className="h-7 w-7" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* --- НАЧАЛО ИЗМЕНЕНИЙ --- */}
      <MobileNav
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        user={user}
      />
      {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
    </>
  );
}
