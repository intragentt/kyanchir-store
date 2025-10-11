'use client';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { VercelToolbar } from '@vercel/toolbar/next';
import { useSession } from 'next-auth/react';

function isAdminRole(role?: string | null): boolean {
  if (!role) {
    return false;
  }

  return role === 'ADMIN' || role === 'MANAGEMENT';
}

export default function VercelAnalyticsClient() {
  const sessionResult = useSession();
  const session = sessionResult?.data;

  const normalizedRole =
    typeof session?.user?.role === 'string'
      ? session.user.role
      : session?.user?.role?.name ?? null;

  const canShowToolbar = isAdminRole(normalizedRole);

  return (
    <>
      <Analytics />
      <SpeedInsights />
      {canShowToolbar ? <VercelToolbar /> : null}
    </>
  );
}
