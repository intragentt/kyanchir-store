'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CodeInput from './CodeInput';
import CloseIcon from '../icons/CloseIcon';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Email больше не нужен как пропс, так как все операции идут через сессию
}

const RESEND_COOLDOWN = 60; // 60 секунд

export default function VerificationModal({
  isOpen,
  onClose,
}: VerificationModalProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // Добавляем состояние для сообщения об успехе
  const [resendCooldown, setResendCooldown] = useState(0);
  const router = useRouter();

  // Таймер для повторной отправки кода
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // --- ИЗМЕНЕНО: Упрощенная логика повторной отправки ---
  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST', // Метод остается POST
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'Не удалось отправить код.');

      setSuccess('Новый код отправлен на вашу почту.');
      setResendCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  // --- ИЗМЕНЕНО: Логика проверки кода через новый API-эндпоинт ---
  const handleFormSubmit = async () => {
    if (code.length < 6) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: code }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Неверный или устаревший код.');
      }

      // Если код верный, сервер уже пометил email как подтвержденный.
      // Нам нужно просто обновить страницу, чтобы увидеть изменения.
      setSuccess('Email успешно подтвержден!');
      router.refresh();
      // Закрываем окно через 2 секунды, чтобы пользователь успел прочитать сообщение
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка.');
    } finally {
      setIsLoading(false);
    }
  };

  // Сброс состояния при закрытии/открытии
  useEffect(() => {
    if (!isOpen) {
      setCode('');
      setError('');
      setSuccess('');
      setIsLoading(false);
      setResendCooldown(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-50 px-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in-95 relative w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg sm:p-10">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-400 transition-colors hover:text-gray-700"
          aria-label="Закрыть"
        >
          <CloseIcon className="h-6 w-6" />
        </button>

        <div className="mb-2 text-2xl font-bold text-gray-900">
          Подтвердите ваш Email
        </div>

        <p className="mt-2 text-sm text-gray-600 sm:text-base">
          Мы отправили 6-значный код на вашу почту.
        </p>

        <div className="mt-8">
          <CodeInput
            length={6}
            onChange={setCode}
            onComplete={handleFormSubmit}
          />
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-4 text-sm text-green-600">{success}</p>}

        <div className="mt-8 flex flex-col space-y-3">
          <button
            onClick={handleFormSubmit}
            disabled={isLoading || code.length < 6}
            className="w-full rounded-lg bg-gray-800 py-3.5 text-base font-semibold text-white transition-colors hover:bg-gray-900 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isLoading ? 'Проверка...' : 'Подтвердить'}
          </button>
          <button
            onClick={handleResendCode}
            disabled={resendCooldown > 0}
            className="w-full rounded-lg py-3.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            {resendCooldown > 0
              ? `Отправить еще раз (${resendCooldown}с)`
              : 'Отправить код еще раз'}
          </button>
        </div>
      </div>
    </div>
  );
}
