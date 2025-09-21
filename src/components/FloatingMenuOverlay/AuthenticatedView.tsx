'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SettingsIcon from '../icons/SettingsIcon';
import ShortLogo from '../icons/ShortLogo';
import AdminIcon from '../icons/AdminIcon';
import AvatarPlaceholder from '../AvatarPlaceholder';

// Обновленный тип пользователя
interface UserSession {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  bonusPoints?: number | null;
  emailVerified?: Date | null;
  role?: {
    name?: string | null;
  } | null;
}

interface AuthenticatedViewProps {
  user: UserSession;
  onClose: () => void;
}

const AuthenticatedView = ({ user, onClose }: AuthenticatedViewProps) => {
  // В будущем здесь будет логика для открытия модального окна
  const handleVerificationClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Предотвращаем стандартный переход по ссылке
    console.log('Verification process initiated...');
    // TODO: 1. Call API to send code. 2. Open modal.
  };

  return (
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

          {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Адаптивный блок для Email и кнопки --- */}
          {/* По умолчанию - колонка, с sm (640px) - строка */}
          <div className="mt-0.5 flex flex-col items-start sm:flex-row sm:items-center sm:space-x-2">
            <p className="truncate text-sm text-gray-500">{user?.email}</p>
            {!user.emailVerified && (
              <button
                onClick={handleVerificationClick}
                className="group mt-1 flex flex-shrink-0 cursor-pointer items-center space-x-1.5 rounded-full bg-yellow-100 px-2 py-0.5 transition-colors hover:bg-yellow-200 sm:mt-0"
                aria-label="Подтвердить Email"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-yellow-500"></div>
                <span className="text-xs font-semibold text-yellow-800">
                  {/* Текст для мобильных */}
                  <span className="sm:hidden">Подтвердить Email</span>
                  {/* Текст для десктопа */}
                  <span className="hidden sm:inline">Подтвердить</span>
                </span>
              </button>
            )}
          </div>
          {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}

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
  );
};

export default AuthenticatedView;
