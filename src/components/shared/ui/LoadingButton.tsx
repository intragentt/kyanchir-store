'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface LoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * ⏳ Состояние загрузки
   */
  isLoading?: boolean;
  /**
   * 📍 Позиция спиннера
   */
  spinnerPosition?: 'left' | 'right';
  /**
   * 📝 Текст для screen reader
   */
  spinnerSrText?: string;
}

const SpinnerIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="animate-spin"
    {...props}
  >
    <path d="M4 10a6 6 0 016-6V2a8 8 0 100 16v-2a6 6 0 01-6-6z" />
  </svg>
);

/**
 * 🔘 КНОПКА С СОСТОЯНИЕМ ЗАГРУЗКИ
 *
 * Обеспечивает единый UX для всех кнопок с процессами.
 */
const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  function LoadingButton(
    {
      children,
      className,
      isLoading = false,
      spinnerPosition = 'left',
      spinnerSrText = 'Обработка запроса...',
      disabled,
      ...props
    },
    ref,
  ) {
    console.log('🔄 LoadingButton: рендер', { isLoading, spinnerPosition });

    const content = (
      <>
        {isLoading && spinnerPosition === 'left' && (
          <span className="flex items-center gap-2">
            <SpinnerIcon className="h-4 w-4" />
            <span className="sr-only">{spinnerSrText}</span>
          </span>
        )}
        <span className="flex items-center gap-2">
          {children}
          {isLoading && spinnerPosition === 'right' && (
            <>
              <SpinnerIcon className="h-4 w-4" />
              <span className="sr-only">{spinnerSrText}</span>
            </>
          )}
        </span>
      </>
    );

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600',
          isLoading && 'cursor-not-allowed opacity-70',
          className,
        )}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {content}
      </button>
    );
  },
);

LoadingButton.displayName = 'LoadingButton';

export { LoadingButton };
export type { LoadingButtonProps };
