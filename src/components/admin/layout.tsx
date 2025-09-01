// Местоположение: /src/app/admin/layout.tsx

import Link from 'next/link';

// --- НАЧАЛО ИЗМЕНЕНИЙ ---

// Навигационные ссылки для админки
const adminNavLinks = [
  { name: 'Дашборд', href: '/admin/dashboard' },
  { name: 'Товары', href: '/admin/products' },
  { name: 'Категории', href: '/admin/categories' },
  { name: 'Почта', href: '/admin/mail' }, // <-- Наша новая ссылка
  { name: 'Фильтры', href: '/admin/filters' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Боковая навигационная панель */}
      <aside className="w-64 flex-shrink-0 bg-gray-800 text-white">
        <div className="p-4 text-2xl font-bold">
          <Link href="/admin/dashboard">Kyanchir Admin</Link>
        </div>
        <nav>
          <ul>
            {adminNavLinks.map((link) => (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className="block px-4 py-2 text-lg hover:bg-gray-700"
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Основной контент */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---
