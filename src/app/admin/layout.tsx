// Местоположение: src/app/admin/layout.tsx (ОБНОВЛЕННЫЙ ФАЙЛ)

import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth'; // Наш главный инструмент аутентификации
import AdminHeader from '@/components/admin/AdminHeader'; // <-- Импортируем нашу новую шапку

// Определяем роли админов
const ADMIN_ROLES = ['ADMIN', 'MANAGEMENT'];

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Это корневой Layout для всей админ-панели.
 * Он выполняет две ключевые задачи:
 * 1. ЗАЩИТА: Проверяет права доступа ко всем страницам внутри /admin.
 * 2. ИЗОЛЯЦИЯ: Рендерит специальный, изолированный UI (шапку и фон) только для админки,
 *    полностью игнорируя общую шапку и футер основного сайта.
 */
export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await auth(); // Получаем сессию на сервере

  // Проверяем, существует ли сессия и есть ли у пользователя админская роль
  const isUserAdmin =
    session?.user && ADMIN_ROLES.includes(session.user.role?.name);

  // Если у пользователя нет прав админа, показываем 404.
  if (!isUserAdmin) {
    notFound();
  }

  // Если все проверки пройдены, рендерим изолированный макет админки.
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <AdminHeader /> {/* <-- ИСПОЛЬЗУЕМ ФИКСИРОВАННУЮ ШАПКУ АДМИНКИ */}
      <main className="flex-grow">{children}</main>
    </div>
  );
}
