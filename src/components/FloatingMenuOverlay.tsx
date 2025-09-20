// src/components/FloatingMenuOverlay.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAppStore } from '@/store/useAppStore';
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

const StatusStep = ({
  label,
  status,
  align = 'center',
}: {
  label: string;
  status: 'done' | 'current' | 'pending';
  align?: 'left' | 'center' | 'right';
}) => {
  const textColor = status === 'pending' ? 'text-gray-400' : 'text-gray-800';

  let circleClasses = 'h-4 w-4 rounded-full ';
  if (status === 'done') {
    circleClasses += 'bg-gray-800';
  } else if (status === 'current') {
    circleClasses += 'bg-white border-2 border-gray-800';
  } else {
    circleClasses += 'bg-gray-200';
  }

  const positionClasses = {
    left: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    right: 'right-0',
  }[align];

  return (
    <div className="relative flex-1">
      <div className={`relative mx-auto ${circleClasses}`}></div>
      <span
        className={`absolute mt-2 block whitespace-nowrap text-[10px] font-medium ${textColor} ${positionClasses}`}
      >
        {label}
      </span>
    </div>
  );
};

const AdminIcon = ({ className }: { className?: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 14 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M3.73915 3.29597C3.2614 2.01153 3.84451 0.651706 4.84325 0.202582C5.99574 -0.316038 7.64039 0.406226 8.05327 1.96589C8.83921 0.620935 10.5292 0.247875 11.6336 0.952852C12.8211 1.71073 13.1568 3.60369 12.0657 4.8833C12.1793 4.98045 13.1252 5.81162 12.9855 6.74791C12.8297 7.79171 11.3539 8.77467 9.4841 8.38501C8.40506 10.2766 6.50883 10.8803 5.45656 10.269C4.61296 9.77872 4.46229 8.59557 4.43483 8.33384C3.17663 8.75393 1.9531 8.49116 1.35386 7.71115C0.90357 7.12511 0.948529 6.43293 0.959855 6.26075C1.04154 5.00604 2.15216 3.86265 3.73915 3.29597Z"
      fill="#6B80C5"
    />
    <text
      x="7"
      y="5.8"
      dominantBaseline="middle"
      textAnchor="middle"
      fill="white"
      fontSize="4.3"
      fontWeight="bold"
      fontFamily="sans-serif"
    >
      А
    </text>
  </svg>
);

// --- НАЧАЛО ИЗМЕНЕНИЙ: ChevronIcon теперь рендерит разные SVG вместо вращения ---
const ChevronIcon = ({
  isOpen,
  direction,
  className,
}: {
  isOpen: boolean;
  direction: 'down' | 'right';
  className?: string;
}) => {
  if (direction === 'right') {
    return (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    );
  }

  // Для direction === 'down', мы выбираем иконку в зависимости от состояния isOpen
  if (isOpen) {
    return (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    );
  } else {
    return (
      <svg
        className={className}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    );
  }
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
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(true);
  const user = useAppStore((state) => state.user);
  const isAuthenticated = !!user;
  const { setIsSearchActive } = useStickyHeader();

  const handleSearchClick = () => {
    onClose();
    setIsSearchActive(true);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-white transition-opacity duration-300 ease-in-out ${
        isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
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
              <div className="flex flex-col items-center">
                <Link
                  href="/profile/settings"
                  onClick={onClose}
                  aria-label="Настройки"
                  className="p-2"
                >
                  <SettingsIcon className="h-6 w-6 text-gray-800" />
                </Link>
                {user?.role?.name === 'ADMIN' && (
                  <Link
                    href="https://admin.kyanchir.ru/dashboard"
                    onClick={onClose}
                    aria-label="Админ-панель"
                    className="p-2"
                  >
                    <AdminIcon className="h-6 w-6" />
                  </Link>
                )}
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

          <div className="mt-10 rounded-lg border border-gray-200 transition-colors">
            <button
              onClick={() => setIsDeliveryOpen(!isDeliveryOpen)}
              className="flex w-full items-center justify-between p-4"
            >
              <div className="flex items-center space-x-3">
                <TruckIcon className="h-6 w-6 flex-none text-gray-800" />
                <div className="font-body text-base font-semibold text-gray-800 md:text-lg">
                  Доставка
                </div>
              </div>
              <div className="-mr-6 flex items-center space-x-2">
                <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                <ChevronIcon
                  isOpen={isDeliveryOpen}
                  direction="down"
                  className="h-5 w-5 text-gray-400"
                />
              </div>
            </button>
            {isDeliveryOpen && (
              <div className="animate-in fade-in px-4 pb-4 duration-300">
                <div className="font-body">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-semibold text-gray-800">
                      Заказ #337
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">Розовая пижама</p>
                </div>
                <div className="relative mt-8">
                  <div className="absolute left-2 right-2 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-gray-800"
                      style={{ width: '33.33%' }}
                    ></div>
                  </div>
                  <div className="relative flex justify-between">
                    <StatusStep label="Обработка" status="done" align="left" />
                    <StatusStep label="В пути" status="current" />
                    <StatusStep label="Ожидает" status="pending" />
                    <StatusStep
                      label="Получен"
                      status="pending"
                      align="right"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex cursor-pointer items-center space-x-3 rounded-lg border border-gray-200 p-4 transition-colors">
            <HeartIcon className="h-6 w-6 flex-none text-gray-800" />
            <div className="font-body text-base font-semibold text-gray-800 md:text-lg">
              Избранное
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-gray-200 transition-colors">
            <button
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="flex w-full items-center justify-between p-4"
            >
              <div className="flex items-center space-x-3">
                <CartIcon className="h-6 w-6 flex-none text-gray-800" />
                <div className="font-body text-base font-semibold text-gray-800 md:text-lg">
                  Корзина
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>3</span>
                  <span className="text-gray-300">·</span>
                  <span>7 497 RUB</span>
                </div>
                <ChevronIcon
                  isOpen={isCartOpen}
                  direction="right"
                  className="h-5 w-5 text-gray-400"
                />
              </div>
            </button>
          </div>

          <div className="mt-10 flex cursor-pointer items-center space-x-3 rounded-lg border border-gray-200 p-4 transition-colors">
            <ReceiptIcon className="h-6 w-6 flex-none text-gray-800" />
            <div className="font-body text-base font-semibold text-gray-800 md:text-lg">
              История заказов
            </div>
          </div>

          <div className="mt-10 rounded-lg border border-gray-200 p-4">
            <div className="font-body text-base font-semibold text-gray-800 md:text-lg">
              Магазин
            </div>
            <div className="scrollbar-hide mt-4 flex items-center space-x-4 overflow-x-auto pb-2">
              <div className="flex-shrink-0 cursor-pointer whitespace-nowrap font-body text-base font-medium text-gray-600 transition-colors hover:text-black">
                Все товары
              </div>
              <div className="flex-shrink-0 cursor-pointer whitespace-nowrap font-body text-base font-medium text-gray-600 transition-colors hover:text-black">
                пижамы
              </div>
              <div className="flex-shrink-0 cursor-pointer whitespace-nowrap font-body text-base font-medium text-gray-600 transition-colors hover:text-black">
                нижнее белье
              </div>
              <div className="flex-shrink-0 cursor-pointer whitespace-nowrap font-body text-base font-medium text-gray-600 transition-colors hover:text-black">
                для дома
              </div>
              <div className="flex-shrink-0 cursor-pointer whitespace-nowrap font-body text-base font-medium text-gray-600 transition-colors hover:text-black">
                сертификаты
              </div>
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
