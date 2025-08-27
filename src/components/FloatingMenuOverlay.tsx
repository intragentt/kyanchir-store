// Местоположение: src/components/FloatingMenuOverlay.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/store/useAppStore';
import { useRouter } from 'next/navigation';
import SearchIcon from './icons/SearchIcon';
import HeartIcon from './icons/HeartIcon';
import ChevronIcon from './icons/ChevronIcon';
// --- НАЧАЛО ИЗМЕНЕНИЙ ---
// 1. Импортируем профессионального "Швейцара"
import { signOut } from 'next-auth/react';
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

  // --- НАЧАЛО ИЗМЕНЕНИЙ ---
  // 2. УДАЛЯЕМ старого, "самодельного швейцара" - функция handleSignOut больше не нужна.
  /*
  const handleSignOut = async () => {
    onClose();
    await fetch('/api/auth/logout', { method: 'POST' });
    router.refresh();
  };
  */
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  if (!isOpen) {
    return null;
  }

  return (
    <div className="animate-in fade-in fixed inset-0 z-[100] flex flex-col bg-white p-6 duration-300">
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
            <Link
              href="/profile"
              onClick={onClose}
              className="font-body text-base font-semibold whitespace-nowrap text-gray-800 md:text-lg"
            >
              Личный кабинет
            </Link>
            <p className="truncate text-sm text-gray-500">{user?.email}</p>
            {/* --- НАЧАЛО ИЗМЕНЕНИЙ --- */}
            {/* 3. Даем команду новому "Швейцару". */}
            <button
              onClick={() => {
                onClose(); // Сначала закрываем меню
                signOut({ callbackUrl: '/' }); // Затем вызываем выход
              }}
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
