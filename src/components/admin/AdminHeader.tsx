'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ShortLogo from '@/components/icons/ShortLogo';
import { useAppStore } from '@/store/useAppStore';
import { signOut } from 'next-auth/react';
import ChevronIcon from '../icons/ChevronIcon';

// Определяем структуру ссылок для навигации
const adminNavLinks = [
  { href: '/admin/dashboard', label: 'Склад' },
  { href: '/admin/orders', label: 'Заказы' },
  { href: '/admin/accounts', label: 'Аккаунты' },
  { href: '/admin/mail', label: 'Почта' },
  { href: '/admin/stats', label: 'Статистика' },
  { href: '/admin/sliders', label: 'Слайдеры' },
];

// Этот компонент - просто шапка. Он НЕ ПРИНИМАЕТ children.
export default function AdminHeader() {
  const user = useAppStore((state) => state.user);
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentPage =
    adminNavLinks.find((link) => link.href === pathname)?.label ||
    'Панель управления';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
      {/* Мы заменили PageContainer на стандартный div, чтобы убрать ошибку */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="https://kyanchir.ru" aria-label="На главный сайт">
              <ShortLogo className="logo-brand-color h-5 w-auto" />
            </Link>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 rounded-md px-2 py-1 transition-colors hover:bg-gray-100"
              >
                <span className="text-sm font-semibold text-gray-800">
                  {currentPage}
                </span>
                <ChevronIcon
                  isOpen={isDropdownOpen}
                  direction="down"
                  className="h-4 w-4 text-gray-500"
                />
              </button>

              {isDropdownOpen && (
                <div className="animate-in fade-in zoom-in-95 absolute left-0 top-full mt-2 w-48 origin-top-left rounded-md border border-gray-200 bg-white p-1 shadow-lg ring-1 ring-black ring-opacity-5">
                  {adminNavLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsDropdownOpen(false)}
                      className={`block w-full rounded-md px-3 py-1.5 text-left text-sm ${
                        pathname === link.href
                          ? 'bg-gray-100 font-semibold text-gray-900'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="hidden text-sm text-gray-700 sm:block">
              {user?.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: 'https://kyanchir.ru' })}
              className="text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
