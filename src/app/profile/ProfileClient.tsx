// Местоположение: src/app/profile/ProfileClient.tsx
'use client';

import { useState } from 'react';
import type { User } from '@prisma/client'; // Импортируем тип User для пропсов
import SignOutButton from './SignOutButton';

interface ProfileClientProps {
  user: User;
}

export default function ProfileClient({
  user: initialUser,
}: ProfileClientProps) {
  // --- Состояния для управления данными и UI ---
  const [user, setUser] = useState(initialUser);
  const [name, setName] = useState(initialUser.name || '');
  const [isEditingName, setIsEditingName] = useState(false);

  // Состояния для ошибок и уведомлений
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- Обработчики действий ---

  const handleUpdateName = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    // TODO: Здесь будет вызов API для обновления имени
    // const res = await fetch('/api/user/profile', { method: 'PATCH', body: JSON.stringify({ name }) });
    // Пока просто имитируем успех для проверки UI
    setTimeout(() => {
      setUser({ ...user, name: name });
      setIsEditingName(false);
      setIsLoading(false);
      setSuccess('Имя успешно обновлено!');
    }, 1000);
  };

  const handleSendVerificationEmail = () => {
    // TODO: Здесь будет вызов API для отправки письма
    setSuccess('Письмо с подтверждением отправлено на ваш email.');
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center">
        {/* Используем div вместо h1, как вы просили */}
        <div className="font-body text-3xl font-bold tracking-tight">
          Личный кабинет
        </div>
        <div className="font-body mt-2 text-lg text-gray-600">
          Добро пожаловать, {user.name || user.email}!
        </div>
      </div>

      {/* Блок с уведомлениями */}
      {error && (
        <div className="rounded-md bg-red-100 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-100 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* --- Секция "Имя" --- */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-body font-semibold text-gray-500">Имя</div>
            {!isEditingName ? (
              <div className="font-body text-lg">
                {user.name || 'Не указано'}
              </div>
            ) : (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="font-body mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
              />
            )}
          </div>
          {!isEditingName ? (
            <button
              onClick={() => setIsEditingName(true)}
              className="font-body text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Изменить
            </button>
          ) : (
            <div className="flex gap-x-2">
              <button
                onClick={handleUpdateName}
                disabled={isLoading}
                className="font-body text-sm font-semibold text-green-600 hover:text-green-500 disabled:opacity-50"
              >
                {isLoading ? '...' : 'Сохранить'}
              </button>
              <button
                onClick={() => setIsEditingName(false)}
                className="font-body text-sm text-gray-500 hover:text-gray-700"
              >
                Отмена
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- Секция "Email" --- */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="font-body font-semibold text-gray-500">Email</div>
        <div className="flex items-center justify-between">
          <div className="font-body text-lg">{user.email}</div>
          {/* TODO: Добавить кнопку "Изменить" для email */}
        </div>
        {!user.emailVerified ? (
          <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-amber-800">
                Ваш email не подтвержден.
              </div>
              <button
                onClick={handleSendVerificationEmail}
                className="font-body text-sm font-semibold whitespace-nowrap text-indigo-600 hover:text-indigo-500"
              >
                Отправить письмо
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-2 text-sm text-green-600">Email подтвержден.</div>
        )}
      </div>

      {/* --- Секция "Пароль" --- */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-body font-semibold text-gray-500">Пароль</div>
            <div className="font-body text-lg">************</div>
          </div>
          {/* TODO: Добавить кнопку "Изменить" для пароля */}
          <button className="font-body text-sm font-semibold text-indigo-600 hover:text-indigo-500">
            Изменить
          </button>
        </div>
      </div>

      <div className="mt-6">
        <SignOutButton />
      </div>
    </div>
  );
}
