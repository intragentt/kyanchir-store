'use client';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { VercelToolbar } from '@vercel/toolbar/next';

export default function VercelAnalyticsClient() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
      <VercelToolbar />
    </>
  );
}
