import 'server-only';

import { unstable_noStore as noStore } from 'next/cache';
import prisma from '@/lib/prisma';

const SETTINGS_KEY = 'MOYSKLAD_API_KEY';

export interface MoyskladSettingsSnapshot {
  hasApiKey: boolean;
  lastFour: string | null;
  updatedAt: Date | null;
}

const extractLastFour = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.slice(-4);
};

export const getMoyskladSettings = async (): Promise<MoyskladSettingsSnapshot> => {
  noStore();

  const record = await prisma.systemSetting.findUnique({
    where: { key: SETTINGS_KEY },
  });

  if (!record) {
    return {
      hasApiKey: false,
      lastFour: null,
      updatedAt: null,
    };
  }

  const trimmed = record.value.trim();

  return {
    hasApiKey: Boolean(trimmed),
    lastFour: extractLastFour(trimmed),
    updatedAt: record.updatedAt,
  };
};
