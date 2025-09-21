'use client';

import { useState } from 'react';
import Link from 'next/link'; // Убедитесь, что импорт из 'next/link'
import Logo from './icons/Logo';
import CloseIcon from './icons/CloseIcon';
import BurgerIcon from './icons/BurgerIcon';
import SearchIcon from './icons/SearchIcon';
import { useAppStore } from '@/store/useAppStore';

interface HeaderProps {
  className?: string;
  isSearchActive: boolean;
  onSearchToggle: (isActive: boolean) => void;
  isMenuOpen: boolean;
  onMenuToggle: (isOpen: boolean) => void;
}

export default function Header({
  className = '',
  isSearchActive,
  onSearchToggle,
  isMenuOpen,
  onMenuToggle,
}: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const setFloatingMenuOpen = useAppStore((state) => state.setFloatingMenuOpen);

  return (
    <header className={`w-full bg-white ${className}`}>
      <div className="container mx-auto flex h-full items-center justify-between px-4 py-4 sm:px-6 lg:px-8 xl:px-12">
        {!isSearchActive ? (
          <div className="flex w-full items-center justify-between">
            {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Логотип обернут в Link --- */}
            <Link
              href="/" // Эта ссылка всегда ведет на главную страницу
              onClick={() => onMenuToggle(false)}
              aria-label="На главную"
            >
              <Logo className="logo-brand-color h-5 w-auto" />
            </Link>
            {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
            <div className="flex items-center">
              <button
                onClick={() => onSearchToggle(true)}
                aria-label="Поиск"
                className="p-2"
              >
                <SearchIcon className="h-6 w-6" />
              </button>
              <button
                onClick={() => setFloatingMenuOpen(true)}
                className="relative z-50 p-2"
              >
                <BurgerIcon className="h-7 w-7" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex w-full items-center space-x-2">
            <button
              onClick={() => {
                onSearchToggle(false);
                setSearchQuery('');
              }}
              aria-label="Закрыть поиск"
              className="p-2 text-gray-700"
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
            <button
              onClick={() => setFloatingMenuOpen(true)}
              className="relative z-50 p-2 text-gray-700"
            >
              <BurgerIcon className="h-7 w-7" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
