// Местоположение: src/components/Header.tsx
'use client';

import { useState } from 'react'; // Убираем useEffect
import Link from 'next/link';

import Logo from './icons/Logo';
import CloseIcon from './icons/CloseIcon';
import BurgerIcon from './icons/BurgerIcon';
import SearchIcon from './icons/SearchIcon';
import DesktopNav from './header/DesktopNav';
import MobileNav from './header/MobileNav';

// --- ИЗМЕНЕНИЕ 1: Добавляем управление меню в пропсы ---
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
  // --- ИЗМЕНЕНИЕ 2: УДАЛЯЕМ СОБСТВЕННОЕ СОСТОЯНИЕ МЕНЮ ---
  // const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- ИЗМЕНЕНИЕ 3: ПОЛНОСТЬЮ УДАЛЯЕМ КОНФЛИКТУЮЩИЙ useEffect ДЛЯ БЛОКИРОВКИ СКРОЛЛА ---
  // Вся эта логика теперь централизована в layout.tsx, и здесь она больше не нужна.

  return (
    <>
      <header className={`w-full bg-white ${className}`}>
        <div className="container mx-auto flex h-full items-center justify-between px-4 py-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex w-full items-center lg:hidden">
            {!isSearchActive ? (
              <div className="flex w-full items-center justify-between">
                <Link
                  href="/"
                  // --- ИЗМЕНЕНИЕ 4: Используем onMenuToggle для закрытия меню ---
                  onClick={() => onMenuToggle(false)}
                  aria-label="На главную"
                  className="-mt-1"
                >
                  <Logo className="logo-brand-color h-[10px] w-auto" />
                </Link>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onSearchToggle(true)}
                    aria-label="Поиск"
                    className="p-2 text-gray-700"
                  >
                    <SearchIcon className="h-6 w-6" />
                  </button>
                  {/* --- ИЗМЕНЕНИЕ 5: Кнопка меню теперь тоже сообщает наверх --- */}
                  <button
                    onClick={() => onMenuToggle(!isMenuOpen)}
                    className="relative z-50 p-2 text-gray-700"
                  >
                    {isMenuOpen ? (
                      <CloseIcon className="h-7 w-7" />
                    ) : (
                      <BurgerIcon className="h-7 w-7" />
                    )}
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
                {/* Эта кнопка тоже сообщает наверх */}
                <button
                  onClick={() => onMenuToggle(!isMenuOpen)}
                  className="relative z-50 p-2 text-gray-700"
                >
                  {isMenuOpen ? (
                    <CloseIcon className="h-7 w-7" />
                  ) : (
                    <BurgerIcon className="h-7 w-7" />
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="hidden items-center justify-between lg:flex">
            <Link
              href="/"
              onClick={() => onMenuToggle(false)}
              aria-label="На главную"
              className="-mt-1"
            >
              <Logo className="logo-brand-color h-[10px] w-auto" />
            </Link>
            <DesktopNav />
          </div>
        </div>
      </header>

      <MobileNav isOpen={isMenuOpen} onClose={() => onMenuToggle(false)} />
    </>
  );
}