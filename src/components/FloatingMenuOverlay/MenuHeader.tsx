'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStickyHeader } from '@/context/StickyHeaderContext';
import Logo from '../icons/Logo';
import SearchIcon from '../icons/SearchIcon';
import CloseIcon from '../icons/CloseIcon';

interface MenuHeaderProps {
  onClose: () => void;
}

const MenuHeader = ({ onClose }: MenuHeaderProps) => {
  const [isSearchModeActive, setIsSearchModeActive] = useState(false);
  const { setIsSearchActive } = useStickyHeader();

  const handleSearchClick = () => {
    onClose();
    setIsSearchActive(true);
  };

  return (
    <div className="flex-shrink-0 px-4 py-4 sm:px-6 lg:px-8 xl:px-12">
      <div className="flex w-full items-center justify-between">
        {!isSearchModeActive ? (
          <>
            <Link href="https://kyanchir.ru" onClick={onClose}>
              <Logo className="logo-brand-color h-5 w-auto" />
            </Link>
            <div className="flex items-center">
              <button
                aria-label="Активировать поиск"
                className="p-2"
                onClick={handleSearchClick}
              >
                <SearchIcon className="h-6 w-6 text-gray-800" />
              </button>
              {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Убираем лишний отступ справа у иконки закрытия --- */}
              <button
                aria-label="Закрыть меню"
                className="py-2 pl-2" // Заменено p-2 на py-2 pl-2
                onClick={onClose}
              >
                <CloseIcon className="h-7 w-7 text-gray-800" />
              </button>
              {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
            </div>
          </>
        ) : (
          <div className="flex w-full items-center space-x-2">
            <button
              aria-label="Закрыть поиск"
              className="p-2"
              onClick={() => setIsSearchModeActive(false)}
            >
              <CloseIcon className="h-6 w-6 text-gray-700" />
            </button>
            <div className="relative flex-grow">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="search"
                placeholder="Поиск..."
                className="w-full rounded-lg border-none bg-gray-100 py-3 pl-10 pr-4 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuHeader;
