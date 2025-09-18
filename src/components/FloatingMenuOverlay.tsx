// Местоположение: src/components/FloatingMenuOverlay.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { useRouter } from 'next/navigation';
import SearchIcon from './icons/SearchIcon';
import HeartIcon from './icons/HeartIcon';
import ChevronIcon from './icons/ChevronIcon';
import { signOut } from 'next-auth/react';
import SettingsIcon from './icons/SettingsIcon';
// --- НАЧАЛО ИЗМЕНЕНИЙ: Импортируем новую иконку ---
import TruckIcon from './icons/TruckIcon';
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
  const router = useRouter();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="animate-in fade-in fixed inset-0 z-[100] flex flex-col bg-white p-6 duration-300">
      {isHelpOpen && (
        <div className="animate-in slide-in-from-top-5 flex flex-col space-y-3 duration-300">
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
            <ChevronIcon
              isOpen={isHelpOpen}
              className="h-7 w-7 text-gray-800"
            />
          </button>
        </div>
      </div>

      <div className="mt-10">
        {isAuthenticated ? (
          <div className="flex flex-col space-y-4">
            <div>
              {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Заменяем "Личный кабинет" на имя пользователя --- */}
              <Link
                href="/profile"
                onClick={onClose}
                className="whitespace-nowrap font-body text-base font-semibold text-gray-800 md:text-lg"
              >
                {user?.name || 'Личный кабинет'}
              </Link>
              {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
              <p className="truncate text-sm text-gray-500">{user?.email}</p>
            </div>

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

        {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем новый пункт "Доставка" --- */}
        <div className="mt-6 flex items-center space-x-3">
          <TruckIcon className="h-6 w-6 flex-none text-gray-800" />
          <div className="font-body text-base font-semibold text-gray-800 md:text-lg">
            Доставка
          </div>
        </div>
        {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}

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
        <div className="mt-10 font-body text-base font-semibold text-gray-800 md:text-lg">
          Корзина
        </div>
      </div>
    </div>
  );
}

FloatingMenuOverlay.displayName = 'FloatingMenuOverlay';
