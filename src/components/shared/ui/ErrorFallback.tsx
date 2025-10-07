'use client';

import React from 'react';
import { LoadingButton } from './LoadingButton';

interface ErrorFallbackProps {
  /**
   * 🧾 Сообщение об ошибке
   */
  message?: string;
  /**
   * 🔁 Обработчик повторной попытки
   */
  onRetry?: () => void;
}

/**
 * 🛡️ РЕЗЕРВНЫЙ КОМПОНЕНТ ОШИБКИ
 *
 * Показывается, когда ErrorBoundary перехватывает ошибку.
 */
const ErrorFallback = ({
  message = 'Что-то пошло не так. Попробуйте обновить страницу.',
  onRetry,
}: ErrorFallbackProps) => {
  console.log('❌ ErrorFallback: отображение сообщения', { message });

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50 p-6 text-center"
    >
      <div className="text-lg font-semibold text-red-700">⚠️ Ой! Возникла проблема</div>
      <p className="text-sm text-red-600">{message}</p>
      {onRetry && (
        <LoadingButton
          onClick={onRetry}
          className="bg-white text-red-700 hover:bg-red-100"
        >
          Попробовать снова
        </LoadingButton>
      )}
    </div>
  );
};

export { ErrorFallback };
export type { ErrorFallbackProps };
