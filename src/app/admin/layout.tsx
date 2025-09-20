// Местоположение: src/app/admin/layout.tsx (НОВЫЙ ФАЙЛ)

import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth'; // Наш главный инструмент аутентификации

// Определяем роли админов, чтобы не дублировать код
const ADMIN_ROLES = ['ADMIN', 'MANAGEMENT'];

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Это корневой Layout для всей админ-панели.
 * Он является "главным охранником", который проверяет доступ КО ВСЕМ страницам внутри /admin.
 * Эта проверка происходит на сервере, где у нас есть 100% надёжный доступ к сессии.
 */
export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await auth(); // Получаем сессию на сервере

  // Проверяем, существует ли сессия и есть ли у пользователя админская роль
  const isUserAdmin =
    session?.user && ADMIN_ROLES.includes(session.user.role?.name);

  // Если у пользователя нет прав админа...
  if (!isUserAdmin) {
    // ...показываем страницу 404.
    // Это лучший способ скрыть существование админки от посторонних.
    notFound();
  }

  // Если все проверки пройдены, показываем запрошенную страницу.
  return <>{children}</>;
}
