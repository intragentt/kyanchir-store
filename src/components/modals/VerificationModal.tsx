'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useAppStore } from '@/store/useAppStore';
import CodeInput from './CodeInput';
import CloseIcon from '../icons/CloseIcon'; // <-- ШАГ 1: Импортируем иконку закрытия

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string | null | undefined;
}

const RESEND_COOLDOWN = 60; // 60 секунд

export default function VerificationModal({
  isOpen,
  onClose,
  email,
}: VerificationModalProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const fetchUser = useAppStore((state) => state.fetchUser);

  // Таймер для повторной отправки кода
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResendCode = async () => {
    if (!email || resendCooldown > 0) return;

    try {
      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error('Не удалось отправить код.');
      setResendCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    }
  };

  const handleFormSubmit = async () => {
    if (!email || code.length < 6) return;

    setIsLoading(true);
    setError('');

    const res = await signIn('email-code', {
      redirect: false,
      email,
      token: code,
    });

    if (res?.ok) {
      await fetchUser();
      onClose();
    } else {
      setError('Неверный или устаревший код.');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isOpen) {
      setCode('');
      setError('');
      setIsLoading(false);
      setResendCooldown(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-50 px-4 backdrop-blur-sm">
      <div className="animate-in fade-in zoom-in-95 relative w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg sm:p-10">
        {/* --- НАЧАЛО ИЗМЕНЕНИЙ --- */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-400 transition-colors hover:text-gray-700"
          aria-label="Закрыть"
        >
          <CloseIcon className="h-6 w-6" />
        </button>

        {/* Логотип удален */}

        <div className="mb-2 text-2xl font-bold text-gray-900">
          Введите код подтверждения
        </div>
        {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}

        <p className="mt-2 text-sm text-gray-600 sm:text-base">
          Мы отправили 6-значный код на{' '}
          <span className="font-semibold text-gray-800">{email}</span>
        </p>

        <div className="mt-8">
          <CodeInput
            length={6}
            onChange={setCode}
            onComplete={handleFormSubmit}
          />
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

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
