// Местоположение: src/components/FloatingMenuOverlay.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAppStore } from '@/store/useAppStore';
import { signOut } from 'next-auth/react';
// --- НАЧАЛО ИЗМЕНЕНИЙ: Импортируем всё необходимое ---
import { useStickyHeader } from '@/context/StickyHeaderContext';
import Logo from './icons/Logo';
import SearchIcon from './icons/SearchIcon';
import ChevronIcon from './icons/ChevronIcon';
import SettingsIcon from './icons/SettingsIcon';
import TruckIcon from './icons/TruckIcon';
import HeartIcon from './icons/HeartIcon';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

interface FloatingMenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FloatingMenuOverlay({
  isOpen,
  onClose,
}: FloatingMenuOverlayProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const user = useAppStore((state) => state.user);
  const isAuthenticated = !!user;

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Подключаемся к "мозговому центру" ---
  // Получаем доступ к управлению главным поиском сайта
  const { setIsSearchActive } = useStickyHeader();
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  if (!isOpen) {
    return null;
  }

  const handleSearchClick = () => {
    onClose(); // Сначала закрываем это меню
    setIsSearchActive(true); // Затем открываем главный оверлей поиска
  };

  return (
    // --- НАЧАЛО ИЗМЕНЕНИЙ: Полностью новая структура для фиксации шапки и скролла ---
    <div className="animate-in fade-in fixed inset-0 z-[100] flex flex-col bg-white duration-300">
      {/* --- ШАПКА МЕНЮ (Фиксированная) --- */}
      <div className="flex-shrink-0 border-b border-gray-200 p-6">
        {isHelpOpen && (
          <div className="animate-in slide-in-from-top-5 mb-8 flex flex-col space-y-3 duration-300">
            <div className="cursor-pointer font-body text-base font-medium text-gray-600 transition-colors hover:text-black">
              Политика и Конфиденциальность
            </div>
            <div className="cursor-pointer font-body text-base font-medium text-gray-600 transition-colors hover:text-black">
              Что такое K-койны?
            </div>
            <div className="cursor-pointer font-body text-base font-medium text-gray-600 transition-colors hover:text-black">
              Как определить размер?
            </div>
          </div>
        )}
        <div className="flex w-full items-center justify-between">
          <Link href="/" onClick={onClose}>
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
            <button
              aria-label="Дополнительное меню"
              className="p-2"
              onClick={() => setIsHelpOpen(!isHelpOpen)}
            >
              <ChevronIcon
                isOpen={isHelpOpen}
                className="h-7 w-7 text-gray-800"
              />
            </button>
          </div>
        </div>
      </div>

      {/* --- КОНТЕНТ МЕНЮ (Прокручиваемый) --- */}
      <div className="flex-grow overflow-y-auto p-6">
        {isAuthenticated ? (
          <div className="flex items-center space-x-4">
            <Image
              src={user?.image || '/placeholder.png'}
              alt="Аватар"
              width={64}
              height={64}
              className="h-16 w-16 flex-shrink-0 rounded-full object-cover"
            />
            <div className="flex flex-col">
              <Link
                href="/profile"
                onClick={onClose}
                className="whitespace-nowrap font-body text-base font-semibold text-gray-800 md:text-lg"
              >
                {user?.name || 'Личный кабинет'}
              </Link>
              <p className="truncate text-sm text-gray-500">{user?.email}</p>
              <div className="flex items-center space-x-4 pt-2">
                <Link
                  href="/profile/settings"
                  onClick={onClose}
                  className="flex items-center gap-2 text-base font-medium text-gray-700 transition-colors hover:text-black"
                >
                  <SettingsIcon className="h-5 w-5" />
                  <span>Настройки</span>
                </Link>
                <button
                  onClick={() => {
                    onClose();
                    signOut({ callbackUrl: '/' });
                  }}
                  className="text-base font-medium text-red-600 transition-colors hover:text-red-800"
                >
                  Выход
                </button>
              </div>
            </div>
          </div>
        ) : (
          <Link
            href="/login"
            onClick={onClose}
            className="whitespace-nowrap font-body text-base font-semibold text-gray-800 md:text-lg"
          >
            Вход / Регистрация
          </Link>
        )}

        <div className="mt-10 flex items-center space-x-3">
          <HeartIcon className="h-6 w-6 flex-none text-gray-800" />
          <div className="font-body text-base font-semibold text-gray-800 md:text-lg">
            Избранное
          </div>
        </div>
        <div className="mt-6 flex items-center space-x-3">
          <TruckIcon className="h-6 w-6 flex-none text-gray-800" />
          <div className="font-body text-base font-semibold text-gray-800 md:text-lg">
            Доставка
          </div>
        </div>
        <div className="mt-10 font-body text-base font-semibold text-gray-800 md:text-lg">
          Магазин
        </div>
        <div className="mt-4 flex flex-col space-y-3">
          <div className="cursor-pointer font-body text-base font-medium text-gray-600 transition-colors hover:text-black">
            пижамы
          </div>
          <div className="cursor-pointer font-body text-base font-medium text-gray-600 transition-colors hover:text-black">
            нижнее белье
          </div>
          <div className="cursor-pointer font-body text-base font-medium text-gray-600 transition-colors hover:text-black">
            для дома
          </div>
          <div className="cursor-pointer font-body text-base font-medium text-gray-600 transition-colors hover:text-black">
            сертификаты
          </div>
        </div>
        <div className="mt-10 flex flex-col space-y-4">
          <div className="cursor-pointer font-body text-base font-semibold text-gray-800 md:text-lg">
            Политика
          </div>
          <div className="cursor-pointer font-body text-base font-semibold text-gray-800 md:text-lg">
            Конфиденциальность
          </div>
          <div className="cursor-pointer font-body text-base font-semibold text-gray-800 md:text-lg">
            Помощь
          </div>
        </div>
        <div className="mt-10 font-body text-base font-semibold text-gray-800 md:text-lg">
          Корзина
        </div>
      </div>
    </div>
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---
  );
}

FloatingMenuOverlay.displayName = 'FloatingMenuOverlay';
