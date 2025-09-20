// Местоположение: src/components/admin/AdminHeader.tsx (НОВЫЙ ФАЙЛ)
'use client';

import Link from 'next/link';
import Logo from '@/components/icons/Logo';
import { useAppStore } from '@/store/useAppStore';
import { signOut } from 'next-auth/react';
import PageContainer from '../layout/PageContainer';

/**
 * Это специальная, изолированная шапка для админ-панели.
 * Она фиксированная и содержит только самую необходимую навигацию.
 */
export default function AdminHeader() {
  const user = useAppStore((state) => state.user);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <PageContainer>
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Эта ссылка всегда ведет на главный сайт, разрывая цикл редиректов. */}
            <Link href="https://kyanchir.ru">
              <Logo className="logo-brand-color h-5 w-auto" />
            </Link>
            <span className="text-sm font-semibold text-gray-500">
              Панель управления
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">{user?.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: 'https://kyanchir.ru' })}
              className="text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              Выйти
            </button>
          </div>
        </div>
      </PageContainer>
    </header>
  );
}
