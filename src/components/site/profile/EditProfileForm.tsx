'use client';

import React from 'react';
import type { User } from '@prisma/client';
import Image from 'next/image';
import AvatarPlaceholder from '@/components/AvatarPlaceholder';

interface EditProfileFormProps {
  user: User;
  name: string;
  // eslint-disable-next-line no-unused-vars
  setName: (name: string) => void;
  surname: string;
  // eslint-disable-next-line no-unused-vars
  setSurname: (surname: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
}

const EditProfileForm = ({
  user,
  name,
  setName,
  surname,
  setSurname,
  onSave,
  onCancel,
  isPending,
}: EditProfileFormProps) => {
  return (
    <div className="flex w-full items-start justify-between">
      <div className="flex items-center space-x-4">
        {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Стили аватара как в меню --- */}
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
        {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}

        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Имя"
            className="w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
          />
          <input
            type="text"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            placeholder="Фамилия"
            className="w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
          />
        </div>
      </div>

      <div>
        <div className="flex flex-col gap-y-2">
          <button
            onClick={onSave}
            disabled={isPending}
            className="text-sm font-semibold text-green-600 hover:text-green-500 disabled:opacity-50"
          >
            {isPending ? '...' : 'Сохранить'}
          </button>
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileForm;
