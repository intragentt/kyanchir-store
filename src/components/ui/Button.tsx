// Местоположение: src/components/ui/Button.tsx
'use client';

import { useAppStore } from '@/store/useAppStore';
import React, { useState } from 'react';

const SpinnerIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="animate-spin"
    {...props}
  >
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 5.22a.75.75 0 00-1.06 1.06L10 8.06V10a2 2 0 11-4 0V8.28a.75.75 0 00-1.5 0V10a3.5 3.5 0 107 0V8.06l2.78-2.78a.75.75 0 00-1.06-1.06L10 6.94 8.28 5.22z"
      clipRule="evenodd"
    />
  </svg>
);

const WifiSlashIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    {...props}
  >
    <path
      fillRule="evenodd"
      d="M10 3.53a.75.75 0 01.75.75v3.636a.75.75 0 01-1.5 0V4.28a.75.75 0 01.75-.75zM8.857 6.43a.75.75 0 01.75-.75h.786a.75.75 0 010 1.5h-.786a.75.75 0 01-.75-.75zm4.08 3.51a.75.75 0 00-1.06-1.06l-6.152 6.152a.75.75 0 001.06 1.06l6.152-6.152z"
      clipRule="evenodd"
    />
    <path d="M3.235 9.03a.75.75 0 011.06 0c1.384 1.385 3.441 2.19 5.59 2.19s4.206-.805 5.59-2.19a.75.75 0 111.06 1.06c-1.637 1.637-3.953 2.58-6.65 2.58s-5.013-.943-6.65-2.58a.75.75 0 010-1.06z" />
  </svg>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?:
    | 'primary'
    | 'secondary'
    | 'accent-primary'
    | 'accent-secondary'
    | 'accent-solid';
}

export const Button = ({
  children,
  onClick,
  className,
  variant = 'primary',
  ...props
}: ButtonProps) => {
  const isOnline = useAppStore((state) => state.isOnline);
  const showNotification = useAppStore((state) => state.showNotification);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!isOnline) {
      event.preventDefault();
      showNotification('Проблема с подключением', 'error', WifiSlashIcon);
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 3000);
      return;
    }

    if (onClick) {
      onClick(event);
    }
  };

  const baseClasses =
    'font-body flex h-12 flex-1 items-center justify-center rounded-lg text-base font-medium transition-colors';

  const variantClasses = {
    primary: 'bg-[#272727] text-white hover:opacity-80 disabled:bg-gray-400',
    secondary:
      'border border-[#272727] bg-transparent text-[#272727] hover:bg-gray-100 disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400',
    'accent-primary':
      'bg-[#EFF1F8] text-[#5D74BC] hover:brightness-[95%] disabled:bg-gray-100 disabled:text-gray-400',
    'accent-secondary':
      'border border-[#5D74BC] bg-transparent text-[#5D74BC] hover:bg-[#EFF1F8] disabled:border-gray-300 disabled:text-gray-400',
    'accent-solid':
      'bg-[#5D74BC] text-white hover:opacity-90 disabled:bg-blue-200 disabled:text-blue-400',
  };

  return (
    <button
      onClick={handleClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {isLoading ? <SpinnerIcon className="h-6 w-6" /> : children}
    </button>
  );
};

export default Button;
