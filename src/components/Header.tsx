// Местоположение: src/components/Header.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Logo from './icons/Logo';
import CloseIcon from './icons/CloseIcon';
import BurgerIcon from './icons/BurgerIcon';
import SearchIcon from './icons/SearchIcon';
// --- ИЗМЕНЕНИЕ: Больше не импортируем DesktopNav ---
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
        
        {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Единый блок для всех экранов --- */}
        <div className="flex w-full items-center justify-between">
          
          {/* --- Логотип --- */}
          {/* Увеличиваем размер на десктопе с помощью lg:h-[14px] */}
          <Link
            href="/"
            onClick={() => onMenuToggle(false)}
            aria-label="На главную"
            className="-mt-1"
          >
            <Logo className="logo-brand-color h-[10px] w-auto lg:h-[14px]" />
          </Link>

          {/* --- Иконки (Только для мобильных) --- */}
          {/* Весь этот блок будет скрыт на экранах lg и больше */}
          <div className="flex items-center space-x-2 lg:hidden">
            <button
              onClick={() => onSearchToggle(true)}
              aria-label="Поиск"
              className="p-2 text-gray-700"
            >
              <SearchIcon className="h-6 w-6" />
            </button>
            <button
              onClick={() => setFloatingMenuOpen(true)}
              className="relative z-50 p-2 text-gray-700"
            >
              <BurgerIcon className="h-7 w-7" />
            </button>
          </div>
        </div>
        {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}

        {/* --- Поиск на мобильных (остается без изменений, так как он скрыт по умолчанию) --- */}
        {/* Этот блок кода был в `lg:hidden`, так что он не затрагивает десктоп */}
        <div className="hidden w-full items-center lg:hidden">
          {!isSearchActive ? (
             <></> // Пустой фрагмент, так как логика выше уже всё отрисовала
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
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
                  <SearchIcon className="h-5 w-5 text-gray-400" />
                </span>
                <input
                  type="search"
                  placeholder="Поиск по названию..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border-none bg-gray-100 py-3 pr-4 pl-10 text-base text-gray-900 focus:ring-2 focus:ring-gray-300 focus:outline-none"
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
      </div>
    </header>
  );
}