// Местоположение: src/app/admin/settings/test-mode/page.tsx

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getSiteModeSettings } from '@/lib/settings/site-mode';
import SiteModeSettingsForm from '@/components/admin/settings/SiteModeSettingsForm';
import { ToastViewport } from '@/components/shared/ui';

const ADMIN_ROLES = new Set(['ADMIN', 'MANAGEMENT']);

export const metadata = {
  title: 'Тестовый режим и техработы | Kyanchir Admin',
};

export default async function SiteModeSettingsPage() {
  const session = await auth();

  if (!session?.user?.role?.name || !ADMIN_ROLES.has(session.user.role.name)) {
    redirect('/admin/login');
  }

  const snapshot = await getSiteModeSettings();

  const initialSettings = {
    testModeEnabled: snapshot.settings.testModeEnabled,
    testModeMessage: snapshot.settings.testModeMessage,
    hideTestBannerForAdmins: snapshot.settings.hideTestBannerForAdmins,
    maintenanceModeEnabled: snapshot.settings.maintenanceModeEnabled,
    maintenanceMessage: snapshot.settings.maintenanceMessage,
    maintenanceEndsAt: snapshot.settings.maintenanceEndsAt?.toISOString() ?? null,
    hideMaintenanceForAdmins: snapshot.settings.hideMaintenanceForAdmins,
  };

  return (
    <div className="space-y-6">
      <ToastViewport />

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">🛠 Режимы работы сайта</h1>
        <p className="mt-2 text-sm text-gray-600">
          Управляйте тестовой бегущей строкой и заглушкой технических работ без деплоя.
        </p>
      </div>

      <SiteModeSettingsForm initialSettings={initialSettings} />
    </div>
  );
}
