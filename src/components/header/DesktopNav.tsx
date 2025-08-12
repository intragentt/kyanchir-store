// Местоположение: src/components/header/DesktopNav.tsx
import Link from 'next/link';
import SearchIcon from '../icons/SearchIcon';
import CartIcon from '../icons/CartIcon';

// 1. Импортируем наш массив ссылок
import { NAV_LINKS } from '@/config/navigation';

export default function DesktopNav() {
  return (
    <>
      <nav className="flex items-center space-x-6">
        {/* 
          2. Вместо жестко прописанных ссылок, мы используем .map().
          Эта функция "пробегается" по каждому элементу массива NAV_LINKS
          и для каждого из них создает компонент <Link>.
        */}
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href} // React требует уникальный ключ для каждого элемента списка
            href={link.href}
            className="hover:text-brand-lilac text-lg text-gray-500"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      {/* Этот блок остается без изменений */}
      <div className="flex items-center space-x-4">
        <button className="text-text-primary hover:text-brand-lilac p-2">
          <SearchIcon className="h-6 w-6" />
        </button>
        <button className="text-text-primary hover:text-brand-lilac p-2">
          <CartIcon className="h-6 w-6" />
        </button>
      </div>
    </>
  );
}
