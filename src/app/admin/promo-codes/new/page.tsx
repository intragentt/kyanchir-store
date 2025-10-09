// Местоположение: src/app/admin/promo-codes/new/page.tsx

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import CreatePromoCodeForm from '@/components/admin/promo-codes/CreatePromoCodeForm';
import { ToastViewport } from '@/components/shared/ui';

const ADMIN_ROLES = new Set(['ADMIN', 'MANAGEMENT']);

export const metadata = {
  title: 'Создание промокода | Kyanchir Admin',
};

export default async function CreatePromoCodePage() {
  const session = await auth();

  if (!session?.user?.role?.name || !ADMIN_ROLES.has(session.user.role.name)) {
    redirect('/admin/login');
  }

  return (
    <div className="space-y-6">
      <ToastViewport />

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">🎟 Создание промокода</h1>
        <p className="mt-2 text-sm text-gray-600">
          Настройте скидку или бонусные баллы, ограничение по использованию и срок действия.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <CreatePromoCodeForm />
      </div>
    </div>
  );
}
