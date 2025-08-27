// Местоположение: src/app/profile/ProfileClient.tsx
'use client';

import { useState } from 'react';
import type { User } from '@prisma/client';
import SignOutButton from './SignOutButton';

interface ProfileClientProps {
  user: User;
}

export default function ProfileClient({
  user: initialUser,
}: ProfileClientProps) {
  // --- ОБЩИЕ СОСТОЯНИЯ ---
  const [user, setUser] = useState(initialUser);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- СОСТОЯНИЯ ДЛЯ РЕДАКТИРОВАНИЯ ИМЕНИ ---
  const [name, setName] = useState(initialUser.name || '');
  const [isEditingName, setIsEditingName] = useState(false);

  // --- НАЧАЛО ИЗМЕНЕНИЙ: СОСТОЯНИЯ ДЛЯ EMAIL И ПАРОЛЯ ---
  // --- СОСТОЯНИЯ ДЛЯ РЕДАКТИРОВАНИЯ EMAIL ---
  const [email, setEmail] = useState(initialUser.email || '');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // --- СОСТОЯНИЯ ДЛЯ РЕДАКТИРОВАНИЯ ПАРОЛЯ ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  // --- ОБРАБОТЧИКИ ДЕЙСТВИЙ ---

  const handleUpdateName = async () => {
    if (name === user.name) {
      setIsEditingName(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не удалось обновить имя.');
      setUser(data);
      setSuccess('Имя успешно обновлено!');
      setIsEditingName(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- НАЧАЛО ИЗМЕНЕНИЙ: НОВЫЕ ОБРАБОТЧИКИ ---
  const handleUpdateEmail = async () => {
    if (email === user.email) {
      setIsEditingEmail(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не удалось обновить email.');
      setUser(data);
      setSuccess('Email успешно обновлен! Теперь его нужно подтвердить.');
      setIsEditingEmail(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      setError('Все поля пароля должны быть заполнены.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Новые пароли не совпадают.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не удалось изменить пароль.');
      setSuccess('Пароль успешно изменен!');
      setIsEditingPassword(false);
      // Очищаем поля после успеха
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  const handleSendVerificationEmail = async () => {
    setIsSendingEmail(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/auth/send-verification-link', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || 'Не удалось отправить письмо.');
      setSuccess('Письмо с подтверждением отправлено на ваш email.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center">
        <div className="font-body text-3xl font-bold tracking-tight">
          Личный кабинет
        </div>
        <div className="font-body mt-2 text-lg text-gray-600">
          Добро пожаловать, {user.name || user.email}!
        </div>
      </div>

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
              disabled={isEditingEmail || isEditingPassword}
              className="font-body text-sm font-semibold text-indigo-600 hover:text-indigo-500 disabled:text-gray-400"
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

      {/* --- НАЧАЛО ИЗМЕНЕНИЙ: ОБНОВЛЕННАЯ СЕКЦИЯ EMAIL --- */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-body font-semibold text-gray-500">Email</div>
            {!isEditingEmail ? (
              <div className="font-body text-lg">{user.email}</div>
            ) : (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="font-body mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
              />
            )}
          </div>
          {!isEditingEmail ? (
            <button
              onClick={() => setIsEditingEmail(true)}
              disabled={isEditingName || isEditingPassword}
              className="font-body text-sm font-semibold text-indigo-600 hover:text-indigo-500 disabled:text-gray-400"
            >
              Изменить
            </button>
          ) : (
            <div className="flex gap-x-2">
              <button
                onClick={handleUpdateEmail}
                disabled={isLoading}
                className="font-body text-sm font-semibold text-green-600 hover:text-green-500 disabled:opacity-50"
              >
                {isLoading ? '...' : 'Сохранить'}
              </button>
              <button
                onClick={() => setIsEditingEmail(false)}
                className="font-body text-sm text-gray-500 hover:text-gray-700"
              >
                Отмена
              </button>
            </div>
          )}
        </div>
        {!user.emailVerified ? (
          <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-amber-800">
                Ваш email не подтвержден.
              </div>
              <button
                onClick={handleSendVerificationEmail}
                disabled={isSendingEmail}
                className="font-body text-sm font-semibold whitespace-nowrap text-indigo-600 hover:text-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSendingEmail ? 'Отправка...' : 'Отправить письмо'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-2 text-sm text-green-600">Email подтвержден.</div>
        )}
      </div>
      {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}

      {/* --- НАЧАЛО ИЗМЕНЕНИЙ: ОБНОВЛЕННАЯ СЕКЦИЯ ПАРОЛЯ --- */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        {!isEditingPassword ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="font-body font-semibold text-gray-500">
                Пароль
              </div>
              <div className="font-body text-lg">************</div>
            </div>
            <button
              onClick={() => setIsEditingPassword(true)}
              disabled={isEditingName || isEditingEmail}
              className="font-body text-sm font-semibold text-indigo-600 hover:text-indigo-500 disabled:text-gray-400"
            >
              Изменить
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="font-body font-semibold text-gray-500">
              Смена пароля
            </div>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Текущий пароль"
              className="font-body block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Новый пароль (мин. 8 символов)"
              className="font-body block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
            />
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Подтвердите новый пароль"
              className="font-body block w-full rounded-md border-gray-300 shadow-sm sm:text-sm"
            />
            <div className="flex justify-end gap-x-2">
              <button
                onClick={handleUpdatePassword}
                disabled={isLoading}
                className="font-body text-sm font-semibold text-green-600 hover:text-green-500 disabled:opacity-50"
              >
                {isLoading ? '...' : 'Сохранить пароль'}
              </button>
              <button
                onClick={() => setIsEditingPassword(false)}
                className="font-body text-sm text-gray-500 hover:text-gray-700"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
      </div>
      {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}

      <div className="mt-6">
        <SignOutButton />
      </div>
    </div>
  );
}
