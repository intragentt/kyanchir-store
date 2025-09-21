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
        {/* Аватар остается статичным во время редактирования */}
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
        {/* Форма для ввода имени и фамилии */}
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
      {/* Кнопки управления формой */}
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
