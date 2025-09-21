'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useAppStore } from '@/store/useAppStore';
import CloseIcon from '../icons/CloseIcon';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string | null | undefined;
}

export default function VerificationModal({
  isOpen,
  onClose,
  email,
}: VerificationModalProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fetchUser = useAppStore((state) => state.fetchUser); // Для обновления сессии

  useEffect(() => {
    // Сбрасываем состояние при каждом открытии/закрытии
    if (!isOpen) {
      setCode('');
      setError('');
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError('');

    // Используем signIn с 'email-code' провайдером, как в auth.ts
    const res = await signIn('email-code', {
      redirect: false,
      email,
      token: code,
    });

    if (res?.ok) {
      // Успех! Обновляем данные пользователя глобально и закрываем окно.
      await fetchUser();
      onClose();
    } else {
      setError(res?.error || 'Неверный или устаревший код.');
    }
    setIsLoading(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    // Оверлей
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      {/* Контейнер модального окна */}
      <div className="animate-in fade-in zoom-in-95 relative w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-700"
          aria-label="Закрыть"
        >
          <CloseIcon className="h-6 w-6" />
        </button>

        <h2 className="mb-2 text-center text-2xl font-bold text-gray-800">
          Подтвердите ваш email
        </h2>
        <p className="mb-6 text-center text-sm text-gray-500">
          Мы отправили код на <span className="font-semibold">{email}</span>
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Введите 6-значный код"
            className="w-full rounded-lg border-gray-300 text-center text-lg tracking-[8px] focus:border-indigo-500 focus:ring-indigo-500"
            maxLength={6}
            autoFocus
          />

          {error && (
            <p className="mt-2 text-center text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || code.length < 6}
            className="mt-6 w-full rounded-lg bg-indigo-600 py-3 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
          >
            {isLoading ? 'Проверка...' : 'Подтвердить'}
          </button>
        </form>
      </div>
    </div>
  );
}
