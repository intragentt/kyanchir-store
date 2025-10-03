// Местоположение: src/components/header/MobileNav.tsx
import Link from 'next/link';
import { NAV_LINKS } from '@/config/navigation';
// --- НАЧАЛО ИЗМЕНЕНИЙ ---
import { Session } from 'next-auth'; // Импортируем тип Session
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

type MobileNavProps = {
  isOpen: boolean;
  onClose: () => void;
  // --- НАЧАЛО ИЗМЕНЕНИЙ ---
  user: Session['user'] | null; // Используем официальный тип пользователя
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
};

export default function MobileNav({ isOpen, onClose, user }: MobileNavProps) {
  return (
    <div
      className={`fixed inset-0 z-100 bg-white transition-opacity duration-300 ease-in-out ${isOpen ? 'visible opacity-100' : 'invisible opacity-0'} lg:hidden`}
    >
      <div className="flex h-full w-full flex-col">
        <div className="h-25 flex-shrink-0"></div>

        <nav className="p- flex-grow overflow-y-auto">
          <div className="flex flex-col items-center space-y-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="text-text-primary hover:text-brand-lilac w-full pl-[5%] text-left text-xl font-light"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="flex-shrink-0 border-t border-gray-100 p-10">
          {user ? (
            <Link
              href="/profile"
              onClick={onClose}
              className="text-text-primary hover:text-brand-lilac block w-full py-3 text-center text-xl font-semibold"
            >
              Личный кабинет
            </Link>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              className="text-text-primary hover:text-brand-lilac block w-full py-3 text-center text-xl font-semibold"
            >
              Войти / Регистрация
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
