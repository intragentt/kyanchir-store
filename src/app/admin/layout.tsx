// Местоположение: src/app/admin/layout.tsx

import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminPathNormalizer from '@/components/admin/AdminPathNormalizer';

const ADMIN_ROLES = ['ADMIN', 'MANAGEMENT'];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await auth();

  const isUserAdmin =
    session?.user && ADMIN_ROLES.includes(session.user.role?.name);

  if (!isUserAdmin) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <AdminPathNormalizer />
      <AdminHeader />
      {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем центральный контейнер для всего контента админки --- */}
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
    </div>
  );
}
