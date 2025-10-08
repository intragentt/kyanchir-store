import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getSdekSettings } from '@/lib/settings/sdek';
import SdekSettingsForm from '@/components/admin/sdek/SdekSettingsForm';
import { ToastViewport } from '@/components/shared/ui';

const ADMIN_ROLES = new Set(['ADMIN', 'MANAGEMENT']);

export const metadata = {
  title: 'СДЭК | Kyanchir Admin',
};

export default async function SdekSettingsPage() {
  const session = await auth();

  if (!session?.user?.role?.name || !ADMIN_ROLES.has(session.user.role.name)) {
    redirect('/admin/login');
  }

  const snapshot = await getSdekSettings();

  return (
    <div className="space-y-6">
      <ToastViewport />

      <SdekSettingsForm
        initialSettings={snapshot.settings}
        initialUpdatedAt={snapshot.updatedAt?.toISOString() ?? null}
      />
    </div>
  );
}
