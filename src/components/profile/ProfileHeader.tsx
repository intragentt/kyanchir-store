'use client';

import React from 'react';
import type { User } from '@prisma/client';
import Image from 'next/image';

import AvatarPlaceholder from '@/components/AvatarPlaceholder';
import ShortLogo from '@/components/icons/ShortLogo';

interface ProfileHeaderProps {
  user: User & { role?: { name?: string | null } | null };
  onEditClick: () => void;
  onSendVerificationEmail: () => void; // Добавляем обработчик для отправки письма
  isSendingEmail: boolean; // Состояние загрузки для кнопки
}

const ProfileHeader = ({
  user,
  onEditClick,
  onSendVerificationEmail,
  isSendingEmail,
}: ProfileHeaderProps) => {
  return (
    <div className="flex w-full items-start justify-between">
      <div className="flex items-center space-x-4">
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border-2 border-gray-200">
          {user.image ? (
            <Image
              src={user.image}
              alt="Аватар"
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <AvatarPlaceholder />
          )}
        </div>
        <div className="flex flex-col">
          <div className="font-body text-2xl font-bold text-gray-800">
            {user.name || ''} {user.surname || ''}
          </div>
          <p className="truncate text-sm text-gray-500">{user.email}</p>
          {!user.emailVerified && (
            <div className="mt-1.5">
              <button
                onClick={onSendVerificationEmail}
                disabled={isSendingEmail}
                className="group flex flex-shrink-0 cursor-pointer items-center space-x-1.5 rounded-full bg-yellow-100 px-2 py-0.5 transition-colors hover:bg-yellow-200 disabled:opacity-50"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-yellow-500"></div>
                <span className="text-xs font-semibold text-yellow-800">
                  {isSendingEmail ? 'Отправка...' : 'Подтвердить Email'}
                </span>
              </button>
            </div>
          )}
          <div className="mt-2 inline-flex items-center space-x-2 self-start rounded-md bg-gray-100 px-2.5 py-1">
            <span className="font-body text-sm font-semibold text-gray-800">
              {user.bonusPoints ?? 0}
            </span>
            <ShortLogo className="h-4 w-auto text-[#6B80C5]" />
          </div>
        </div>
      </div>
      <div>
        <button
          onClick={onEditClick}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
        >
          Изменить
        </button>
      </div>
    </div>
  );
};

export default ProfileHeader;
