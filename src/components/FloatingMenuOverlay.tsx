// Местоположение: src/components/FloatingMenuOverlay.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { useRouter } from 'next/navigation'; // Импортируем роутер
import BurgerIcon from './icons/BurgerIcon';
import SearchIcon from './icons/SearchIcon';
import HeartIcon from './icons/HeartIcon';

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
  const router = useRouter(); // Инициализируем роутер

  // --- НАЧАЛО ИЗМЕНЕНИЙ ---
  const handleSignOut = async () => {
    onClose(); // Сначала закрываем меню
    await fetch('/api/auth/logout', { method: 'POST' });
    // Перезагружаем страницу, чтобы обновить состояние на сервере
    router.refresh();
  };
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  if (!isOpen) {
    return null;
  }

  return (
    <div className="animate-in fade-in fixed inset-0 z-[100] flex flex-col bg-white p-6 duration-300">
      {/* ... (верхняя часть без изменений) ... */}
      {isHelpOpen && (
        <div className="animate-in slide-in-from-top-5 flex flex-col space-y-3 duration-300">
          <div className="font-body cursor-pointer text-base font-medium text-gray-600 transition-colors hover:text-black">
            Политика и Конфиденциальность
          </div>
          <div className="font-body cursor-pointer text-base font-medium text-gray-600 transition-colors hover:text-black">
            Что такое K-койны?
          </div>
          <div className="font-body cursor-pointer text-base font-medium text-gray-600 transition-colors hover:text-black">
            Как определить размер?
          </div>
        </div>
      )}
      <div
        className={`flex w-full flex-none items-center space-x-4 transition-all duration-300 ${isHelpOpen ? 'mt-8' : 'mt-0'}`}
      >
        <div className="flex flex-grow items-center space-x-3 rounded-xl bg-gray-100 px-4 py-3">
          <SearchIcon className="h-5 w-5 flex-none text-gray-500" />
          <div className="font-body text-base text-gray-500">Поиск...</div>
        </div>
        <div className="flex flex-none items-center">
          <button
            aria-label="Основное меню"
            className="p-2"
            onClick={() => setIsHelpOpen(!isHelpOpen)}
          >
            {isHelpOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 text-gray-800"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 15l7-7 7 7"
                />
              </svg>
            ) : (
              <BurgerIcon className="h-7 w-7 text-gray-800" />
            )}
          </button>
        </div>
      </div>

      <div className="mt-10">
        {isAuthenticated ? (
          <div className="flex flex-col space-y-4">
            <Link
              href="/profile"
              onClick={onClose}
              className="font-body text-base font-semibold whitespace-nowrap text-gray-800 md:text-lg"
            >
              Личный кабинет
            </Link>
            <p className="truncate text-sm text-gray-500">{user?.email}</p>
            {/* --- НАЧАЛО ИЗМЕНЕНИЙ --- */}
            {/* Заменяем ссылку на кнопку */}
            <button
              onClick={handleSignOut}
              className="font-body text-left text-base font-medium text-red-600 transition-colors hover:text-red-800"
            >
              Выход
            </button>
            {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
          </div>
        ) : (
          <Link
            href="/login"
            onClick={onClose}
            className="font-body text-base font-semibold whitespace-nowrap text-gray-800 md:text-lg"
          >
            Вход / Регистрация
          </Link>
        )}

        {/* ... (остальная часть без изменений) ... */}
        <div className="mt-10 flex items-center space-x-3">
          <HeartIcon className="h-6 w-6 flex-none text-gray-800" />
          <div className="font-body text-base font-semibold text-gray-800 md:text-lg">
            Избранное
          </div>
        </div>
        <div className="font-body mt-10 text-base font-semibold text-gray-800 md:text-lg">
          Магазин
        </div>
        <div className="mt-4 flex flex-col space-y-3">
          <div className="font-body cursor-pointer text-base font-medium text-gray-600 transition-colors hover:text-black">
            пижамы
          </div>
          <div className="font-body cursor-pointer text-base font-medium text-gray-600 transition-colors hover:text-black">
            нижнее белье
          </div>
          <div className="font-body cursor-pointer text-base font-medium text-gray-600 transition-colors hover:text-black">
            для дома
          </div>
          <div className="font-body cursor-pointer text-base font-medium text-gray-600 transition-colors hover:text-black">
            сертификаты
          </div>
        </div>
        <div className="font-body mt-10 text-base font-semibold text-gray-800 md:text-lg">
          Корзина
        </div>
      </div>
    </div>
  );
}

FloatingMenuOverlay.displayName = 'FloatingMenuOverlay';
