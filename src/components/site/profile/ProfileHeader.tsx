'use client';

import React from 'react';
import type { User } from '@prisma/client'; // <-- ИЗМЕНЕНО: Возвращаемся к стандартному типу
import Image from 'next/image';

import AvatarPlaceholder from '@/components/AvatarPlaceholder';
import { SettingsIcon, ShortLogo } from '@/components/shared/icons';
// --- УДАЛЕНО: Убираем импорт серверной утилиты ---
// import { decrypt } from '@/lib/encryption';

// --- ИЗМЕНЕНО: Обновляем тип, чтобы он принимал готовые, расшифрованные данные ---
type DecryptedUser = User & {
  name: string;
  surname: string;
  email: string;
  role?: { name?: string | null } | null;
};

interface ProfileHeaderProps {
  user: DecryptedUser;
  onEditClick: () => void;
  onSendVerificationEmail: () => void;
  isSendingEmail: boolean;
}

const ProfileHeader = ({
  user,
  onEditClick,
  onSendVerificationEmail,
  isSendingEmail,
}: ProfileHeaderProps) => {
  // --- УДАЛЕНО: Убираем всю логику дешифровки с клиента ---
  // const decryptedName = ...
  // const decryptedSurname = ...
  // const decryptedEmail = ...

  return (
    <div className="flex w-full items-start justify-between border-b border-gray-200 py-5">
      <div className="flex items-center space-x-4">
        <div className="relative h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-full border-[1.2px] border-gray-200">
          {user.image ? (
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
          <div className="whitespace-nowrap font-body text-base font-semibold text-gray-800 md:text-lg">
            {/* ИЗМЕНЕНО: Просто отображаем готовые данные */}
            {user.name} {user.surname}
          </div>

          <div className="mt-0.5 flex flex-col items-start sm:flex-row sm:items-center sm:space-x-2">
            {/* ИЗМЕНЕНО: Просто отображаем готовые данные */}
            <p className="truncate text-sm text-gray-500">{user.email}</p>
            {!user.emailVerified && (
              <button
                onClick={onSendVerificationEmail}
                disabled={isSendingEmail}
                className="group mt-1 flex flex-shrink-0 cursor-pointer items-center space-x-1.5 rounded-full bg-yellow-100 px-2 py-0.5 transition-colors hover:bg-yellow-200 disabled:opacity-50 sm:mt-0"
                aria-label="Подтвердить Email"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-yellow-500"></div>
                <span className="text-xs font-semibold text-yellow-800">
                  <span className="sm:hidden">
                    {isSendingEmail ? 'Отправка...' : 'Подтвердить Email'}
                  </span>
                  <span className="hidden sm:inline">
                    {isSendingEmail ? 'Отправка...' : 'Подтвердить'}
                  </span>
                </span>
              </button>
            )}
          </div>

          <div className="mt-2 inline-flex items-center space-x-2 self-start rounded-md bg-gray-100 px-2.5 py-1">
            <span className="font-body text-sm font-semibold text-gray-800">
              {user.bonusPoints ?? 0}
            </span>
            <ShortLogo className="h-4 w-auto text-[#6B80C5]" />
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <button
          onClick={onEditClick}
          className="p-2"
          aria-label="Изменить профиль"
        >
          <SettingsIcon className="h-6 w-6 text-gray-800" />
        </button>
      </div>
    </div>
  );
};

export default ProfileHeader;
