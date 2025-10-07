// Местоположение: src/components/header/DesktopNav.tsx
import Link from 'next/link';
import { NAV_LINKS } from '@/config/navigation';
// --- НАЧАЛО ИЗМЕНЕНИЙ ---
import { Session } from 'next-auth'; // Импортируем тип Session
import { CartIcon, SearchIcon, UserIcon } from '@/components/shared/icons';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

// --- НАЧАЛО ИЗМЕНЕНИЙ ---
interface DesktopNavProps {
  user: Session['user'] | null; // Используем официальный тип пользователя
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export default function DesktopNav({ user }: DesktopNavProps) {
  return (
    <>
      <nav className="flex items-center space-x-6">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="hover:text-brand-lilac text-lg text-gray-500"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center space-x-4">
        <button className="text-text-primary hover:text-brand-lilac p-2">
          <SearchIcon className="h-6 w-6" />
        </button>
        <button className="text-text-primary hover:text-brand-lilac p-2">
          <CartIcon className="h-6 w-6" />
        </button>

        {user ? (
          <Link
            href="/profile"
            className="text-text-primary hover:text-brand-lilac p-2"
          >
            <UserIcon className="h-6 w-6" />
          </Link>
        ) : (
          <Link
            href="/login"
            className="text-sm font-semibold text-gray-700 hover:text-indigo-600"
          >
            Войти
          </Link>
        )}
      </div>
    </>
  );
}
