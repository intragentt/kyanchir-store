// Местоположение: src/components/layout/StickyHeader.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BurgerIcon, CloseIcon, Logo, SearchIcon } from '../icons';
import DesktopNav from '@/components/site/layout/DesktopNav';
import { useAppStore } from '@/store/useAppStore';

interface StickyHeaderProps {
  isVisible: boolean;
  isTransitionEnabled: boolean;
}

export default function StickyHeader({
  isVisible,
  isTransitionEnabled,
}: StickyHeaderProps) {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const user = useAppStore((state) => state.user);
  const setFloatingMenuOpen = useAppStore((state) => state.setFloatingMenuOpen);

  const headerClasses = [
    'fixed top-0 right-0 left-0 z-152 w-full border-b border-gray-200 bg-white',
    'will-change-transform',
    isTransitionEnabled ? 'transition-transform duration-300 ease-in-out' : '',
    isVisible ? 'transform-none' : '-translate-y-full',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={headerClasses}>
      <div className="container mx-auto flex h-full items-center justify-between px-4 py-4 sm:px-6 lg:px-8 xl:px-12">
        {!isSearchActive && (
          <Link href="/" aria-label="На главную" className="-mt-1">
            <Logo className="logo-brand-color h-[10px] w-auto" />
          </Link>
        )}
        <div className="hidden items-center space-x-6 lg:flex">
          <DesktopNav user={user} />
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
                onClick={() => setFloatingMenuOpen(true)}
                className="relative z-50 mt-[1px] p-[2px] text-gray-700"
              >
                <BurgerIcon className="h-7 w-7" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
