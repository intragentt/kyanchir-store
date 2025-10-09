import 'server-only';

import { unstable_noStore as noStore } from 'next/cache';
import { z } from 'zod';
import prisma from '@/lib/prisma';

export const SITE_MODE_SETTINGS_KEY = 'site-mode-settings';

export interface SiteModeSettings {
  testModeEnabled: boolean;
  testModeMessage: string;
  hideTestBannerForAdmins: boolean;
  maintenanceModeEnabled: boolean;
  maintenanceMessage: string;
  maintenanceEndsAt: Date | null;
  hideMaintenanceForAdmins: boolean;
}

export interface SiteModeSnapshot {
  settings: SiteModeSettings;
  updatedAt: Date | null;
}

export const DEFAULT_SITE_MODE_SETTINGS: SiteModeSettings = {
  testModeEnabled: false,
  testModeMessage: 'Сайт работает в тестовом режиме. Возможны временные сбои.',
  hideTestBannerForAdmins: false,
  maintenanceModeEnabled: false,
  maintenanceMessage: 'Идут технические работы. Пожалуйста, зайдите позже.',
  maintenanceEndsAt: null,
  hideMaintenanceForAdmins: true,
};

const siteModePartialSchema = z
  .object({
    testModeEnabled: z.boolean().optional(),
    testModeMessage: z.string().trim().max(200).optional(),
    hideTestBannerForAdmins: z.boolean().optional(),
    maintenanceModeEnabled: z.boolean().optional(),
    maintenanceMessage: z.string().trim().max(200).optional(),
    maintenanceEndsAt: z.union([z.string(), z.null()]).optional(),
    hideMaintenanceForAdmins: z.boolean().optional(),
  })
  .passthrough();

type SiteModePartial = z.infer<typeof siteModePartialSchema>;

const siteModeUpdateSchema = siteModePartialSchema.refine((value) => {
  if (value.maintenanceEndsAt === undefined || value.maintenanceEndsAt === null) {
    return true;
  }

  const parsed = new Date(value.maintenanceEndsAt);
  return Number.isFinite(parsed.getTime());
}, 'Некорректная дата завершения техработ.');

const mergeWithDefaults = (payload?: SiteModePartial | null): SiteModeSettings => {
  const base = structuredClone(DEFAULT_SITE_MODE_SETTINGS);

  if (!payload) {
    return base;
  }

  return {
    testModeEnabled: payload.testModeEnabled ?? base.testModeEnabled,
    testModeMessage:
      payload.testModeMessage && payload.testModeMessage.trim().length > 0
        ? payload.testModeMessage.trim()
        : base.testModeMessage,
    hideTestBannerForAdmins: payload.hideTestBannerForAdmins ?? base.hideTestBannerForAdmins,
    maintenanceModeEnabled: payload.maintenanceModeEnabled ?? base.maintenanceModeEnabled,
    maintenanceMessage:
      payload.maintenanceMessage && payload.maintenanceMessage.trim().length > 0
        ? payload.maintenanceMessage.trim()
        : base.maintenanceMessage,
    maintenanceEndsAt:
      payload.maintenanceEndsAt === undefined
        ? base.maintenanceEndsAt
        : payload.maintenanceEndsAt
        ? new Date(payload.maintenanceEndsAt)
        : null,
    hideMaintenanceForAdmins: payload.hideMaintenanceForAdmins ?? base.hideMaintenanceForAdmins,
  } satisfies SiteModeSettings;
};

const parseStoredSettings = (raw: string | null): SiteModeSettings => {
  if (!raw) {
    return structuredClone(DEFAULT_SITE_MODE_SETTINGS);
  }

  try {
    const parsed = JSON.parse(raw);
    const normalized = siteModePartialSchema.parse(parsed);
    return mergeWithDefaults(normalized);
  } catch (error) {
    console.error('[site-mode] Не удалось разобрать сохранённые настройки', error);
    return structuredClone(DEFAULT_SITE_MODE_SETTINGS);
  }
};

export async function getSiteModeSettings(): Promise<SiteModeSnapshot> {
  const record = await prisma.systemSetting.findUnique({
    where: { key: SITE_MODE_SETTINGS_KEY },
  });

  if (!record) {
    return {
      settings: structuredClone(DEFAULT_SITE_MODE_SETTINGS),
      updatedAt: null,
    } satisfies SiteModeSnapshot;
  }

  return {
    settings: parseStoredSettings(record.value),
    updatedAt: record.updatedAt,
  } satisfies SiteModeSnapshot;
}

export type SiteModeUpdateInput = z.infer<typeof siteModeUpdateSchema>;

export async function saveSiteModeSettings(payload: SiteModeUpdateInput): Promise<SiteModeSnapshot> {
  noStore();

  const parsed = siteModeUpdateSchema.parse(payload);
  const previous = await getSiteModeSettings();

  const next = mergeWithDefaults({
    ...previous.settings,
    ...parsed,
    maintenanceEndsAt:
      parsed.maintenanceEndsAt === undefined
        ? previous.settings.maintenanceEndsAt?.toISOString() ?? undefined
        : parsed.maintenanceEndsAt,
  });

  const serialized = JSON.stringify({
    ...next,
    maintenanceEndsAt: next.maintenanceEndsAt ? next.maintenanceEndsAt.toISOString() : null,
  });

  const record = await prisma.systemSetting.upsert({
    where: { key: SITE_MODE_SETTINGS_KEY },
    update: { value: serialized },
    create: { key: SITE_MODE_SETTINGS_KEY, value: serialized },
  });

  return {
    settings: next,
    updatedAt: record.updatedAt,
  } satisfies SiteModeSnapshot;
}
