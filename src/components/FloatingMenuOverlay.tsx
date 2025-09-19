// Местоположение: src/components/FloatingMenuOverlay.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAppStore } from '@/store/useAppStore';
import { signOut } from 'next-auth/react';
import { useStickyHeader } from '@/context/StickyHeaderContext';
import Logo from './icons/Logo';
import SearchIcon from './icons/SearchIcon';
import SettingsIcon from './icons/SettingsIcon';
import TruckIcon from './icons/TruckIcon';
import HeartIcon from './icons/HeartIcon';
import CloseIcon from './icons/CloseIcon';
import AvatarPlaceholder from './AvatarPlaceholder';
import ReceiptIcon from './icons/ReceiptIcon';
import ShortLogo from './icons/ShortLogo';
import CartIcon from './icons/CartIcon';
import ChevronIcon from './icons/ChevronIcon';

// --- НАЧАЛО ИЗМЕНЕНИЙ: Возвращаем вспомогательный компонент для трекера ---
const StatusStep = ({
  label,
  status,
}: {
  label: string;
  status: 'done' | 'current' | 'pending';
}) => {
  const isDone = status === 'done';
  const isCurrent = status === 'current';
  const colors =
    isDone || isCurrent
      ? 'bg-indigo-600 text-indigo-600'
      : 'bg-gray-200 text-gray-400';

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative flex h-3 w-3 items-center justify-center rounded-full ${colors}`}
      >
        {isCurrent && <div className="h-1.5 w-1.5 rounded-full bg-white"></div>}
      </div>
      <span className={`mt-1 text-center text-[10px] font-medium ${colors}`}>
        {label}
      </span>
    </div>
  );
};
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

interface FloatingMenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FloatingMenuOverlay({
  isOpen,
  onClose,
}: FloatingMenuOverlayProps) {
  const [isSearchModeActive, setIsSearchModeActive] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);
  const user = useAppStore((state) => state.user);
  const isAuthenticated = !!user;
  const { setIsSearchActive } = useStickyHeader();

  if (!isOpen) {
    return null;
  }

  const handleSearchClick = () => {
    onClose();
    setIsSearchActive(true);
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-white duration-300">
      <div className="flex-shrink-0 px-4 py-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex w-full items-center justify-between">
          {!isSearchModeActive ? (
            <>
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
                  aria-label="Закрыть меню"
                  className="p-2"
                  onClick={onClose}
                >
                  <CloseIcon className="h-7 w-7 text-gray-800" />
                </button>
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
      <div className="flex flex-grow flex-col overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex-grow">
          {isAuthenticated ? (
            <div className="flex w-full items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-full border-[1.2px] border-gray-200">
                  {user?.image ? (
                    <Image
                      src={user.image}
                      alt="Аватар"
                      fill
                      sizes="72px"
                      className="object-cover"
                    />
                  ) : (
                    <AvatarPlaceholder />
                  )}
                </div>
                <div className="flex flex-col">
                  <Link
                    href="/profile"
                    onClick={onClose}
                    className="whitespace-nowrap font-body text-base font-semibold text-gray-800 md:text-lg"
                  >
                    {user?.name || 'Личный кабинет'}
                  </Link>
                  <p className="truncate text-sm text-gray-500">
                    {user?.email}
                  </p>
                  <div className="mt-2 inline-flex items-center space-x-2 self-start rounded-md bg-gray-100 px-2.5 py-1">
                    <span className="font-body text-sm font-semibold text-gray-800">
                      {user?.bonusPoints ?? 0}
                    </span>
                    <ShortLogo className="h-4 w-auto text-[#6B80C5]" />
                  </div>
                </div>
              </div>
              <Link
                href="/profile/settings"
                onClick={onClose}
                aria-label="Настройки"
                className="p-2"
              >
                <SettingsIcon className="h-6 w-6 text-gray-800" />
              </Link>
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

          <div className="mt-10">
            <button
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="flex w-full items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <CartIcon className="h-6 w-6 flex-none text-gray-800" />
                <div className="font-body text-base font-semibold text-gray-800 md:text-lg">
                  Корзина
                </div>
              </div>
              <ChevronIcon
                isOpen={isCartOpen}
                direction="right"
                className="h-5 w-5 text-gray-400"
              />
            </button>
          </div>

          <div className="mt-6">
            <button
              onClick={() => setIsDeliveryOpen(!isDeliveryOpen)}
              className="flex w-full items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <TruckIcon className="h-6 w-6 flex-none text-gray-800" />
                <div className="font-body text-base font-semibold text-gray-800 md:text-lg">
                  Доставка
                </div>
              </div>
              <ChevronIcon
                isOpen={isDeliveryOpen}
                direction="down"
                className="h-5 w-5 text-gray-400"
              />
            </button>
            {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Возвращаем "фейковый" заказ внутрь аккордеона --- */}
            {isDeliveryOpen && (
              <div className="animate-in fade-in ml-9 mt-4 rounded-lg border border-gray-200 p-4 duration-300">
                <div className="font-body">
                  <p className="text-sm font-semibold text-gray-800">
                    Заказ #337
                  </p>
                  <p className="text-xs text-green-600">Статус: В пути</p>
                  <p className="mt-2 text-sm text-gray-600">"Розовая пижама"</p>
                </div>
                <div className="mt-4 flex items-center">
                  <StatusStep label="Обработка" status="done" />
                  <div className="h-0.5 w-full flex-grow bg-indigo-600"></div>
                  <StatusStep label="В пути" status="current" />
                  <div className="h-0.5 w-full flex-grow bg-gray-200"></div>
                  <StatusStep label="Ожидает" status="pending" />
                  <div className="h-0.5 w-full flex-grow bg-gray-200"></div>
                  <StatusStep label="Получен" status="pending" />
                </div>
              </div>
            )}
            {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
          </div>

          <div className="mt-10 flex items-center space-x-3">
            <HeartIcon className="h-6 w-6 flex-none text-gray-800" />
            <div className="font-body text-base font-semibold text-gray-800 md:text-lg">
              Избранное
            </div>
          </div>
          <div className="mt-6 flex items-center space-x-3">
            <ReceiptIcon className="h-6 w-6 flex-none text-gray-800" />
            <div className="font-body text-base font-semibold text-gray-800 md:text-lg">
              Купленные товары
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
              Что такое К-койны?
            </div>
            <div className="cursor-pointer font-body text-base font-semibold text-gray-800 md:text-lg">
              Как определить размер?
            </div>
            <div className="cursor-pointer font-body text-base font-semibold text-gray-800 md:text-lg">
              Помощь
            </div>
          </div>
        </div>
        <div className="mt-auto flex-shrink-0 border-t border-gray-200 pt-6">
          <div className="flex items-center justify-center space-x-6">
            <div className="cursor-pointer font-body text-sm font-medium text-gray-500 transition-colors hover:text-black">
              Политика
            </div>
            <div className="cursor-pointer font-body text-sm font-medium text-gray-500 transition-colors hover:text-black">
              Конфиденциальность
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

FloatingMenuOverlay.displayName = 'FloatingMenuOverlay';
