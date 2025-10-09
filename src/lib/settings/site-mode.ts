import 'server-only';

import { unstable_noStore as noStore } from 'next/cache';
import { z } from 'zod';
import prisma from '@/lib/prisma';

export const SITE_MODE_SETTINGS_KEY = 'site-mode-settings';

export interface SiteModeSettings {
  testModeEnabled: boolean;
  testModeMessage: string;
  testModeMarqueeSpeed: number;
  hideTestBannerForAdmins: boolean;
  maintenanceModeEnabled: boolean;
  maintenanceMessage: string;
  maintenanceEndsAt: Date | null;
  hideMaintenanceForAdmins: boolean;
  maintenanceCtaEnabled: boolean;
  maintenanceCtaLabel: string;
  maintenanceCtaHref: string;
  maintenanceBackdropColor: string;
  maintenanceBackdropOpacity: number;
  maintenanceTextColor: string;
}

export interface SiteModeSnapshot {
  settings: SiteModeSettings;
  updatedAt: Date | null;
}

export const DEFAULT_SITE_MODE_SETTINGS: SiteModeSettings = {
  testModeEnabled: false,
  testModeMessage: 'Сайт работает в тестовом режиме. Возможны временные сбои.',
  testModeMarqueeSpeed: 18,
  hideTestBannerForAdmins: false,
  maintenanceModeEnabled: false,
  maintenanceMessage: 'Идут технические работы. Пожалуйста, зайдите позже.',
  maintenanceEndsAt: null,
  hideMaintenanceForAdmins: true,
  maintenanceCtaEnabled: false,
  maintenanceCtaLabel: 'Написать в поддержку',
  maintenanceCtaHref: '',
  maintenanceBackdropColor: '#020617',
  maintenanceBackdropOpacity: 80,
  maintenanceTextColor: '#f8fafc',
};

const siteModePartialSchema = z
  .object({
    testModeEnabled: z.boolean().optional(),
    testModeMessage: z.string().trim().max(200).optional(),
    testModeMarqueeSpeed: z.number().min(4).max(60).optional(),
    hideTestBannerForAdmins: z.boolean().optional(),
    maintenanceModeEnabled: z.boolean().optional(),
    maintenanceMessage: z.string().trim().max(200).optional(),
    maintenanceEndsAt: z.union([z.string(), z.null()]).optional(),
    hideMaintenanceForAdmins: z.boolean().optional(),
    maintenanceCtaEnabled: z.boolean().optional(),
    maintenanceCtaLabel: z.string().trim().max(100).optional(),
    maintenanceCtaHref: z.string().trim().max(300).optional(),
    maintenanceBackdropColor: z
      .string()
      .regex(/^#?([a-f\d]{3}|[a-f\d]{6})$/i, 'Укажите цвет в формате HEX')
      .optional(),
    maintenanceBackdropOpacity: z.number().min(0).max(100).optional(),
    maintenanceTextColor: z
      .string()
      .regex(/^#?([a-f\d]{3}|[a-f\d]{6})$/i, 'Укажите цвет в формате HEX')
      .optional(),
  })
  .passthrough();

type SiteModePartial = z.infer<typeof siteModePartialSchema>;

const siteModeUpdateSchema = siteModePartialSchema.superRefine((value, ctx) => {
  if (value.maintenanceEndsAt !== undefined && value.maintenanceEndsAt !== null) {
    const parsed = new Date(value.maintenanceEndsAt);
    if (!Number.isFinite(parsed.getTime())) {
      ctx.addIssue({
        path: ['maintenanceEndsAt'],
        code: z.ZodIssueCode.custom,
        message: 'Некорректная дата завершения техработ.',
      });
    }
  }

  if (value.maintenanceCtaHref && value.maintenanceCtaHref.trim().length > 0) {
    try {
      // URL constructor выбрасывает исключение, если ссылка некорректная
      const url = new URL(value.maintenanceCtaHref);
      if (!url.protocol.startsWith('http')) {
        throw new Error('invalid protocol');
      }
    } catch {
      ctx.addIssue({
        path: ['maintenanceCtaHref'],
        code: z.ZodIssueCode.custom,
        message: 'Укажите ссылку в формате https://example.com',
      });
    }
  }
});

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
    testModeMarqueeSpeed: payload.testModeMarqueeSpeed ?? base.testModeMarqueeSpeed,
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
    maintenanceCtaEnabled: payload.maintenanceCtaEnabled ?? base.maintenanceCtaEnabled,
    maintenanceCtaLabel:
      payload.maintenanceCtaLabel && payload.maintenanceCtaLabel.trim().length > 0
        ? payload.maintenanceCtaLabel.trim()
        : base.maintenanceCtaLabel,
    maintenanceCtaHref:
      payload.maintenanceCtaHref && payload.maintenanceCtaHref.trim().length > 0
        ? payload.maintenanceCtaHref.trim()
        : '',
    maintenanceBackdropColor:
      payload.maintenanceBackdropColor && payload.maintenanceBackdropColor.trim().length > 0
        ? payload.maintenanceBackdropColor.startsWith('#')
          ? payload.maintenanceBackdropColor
          : `#${payload.maintenanceBackdropColor}`
        : base.maintenanceBackdropColor,
    maintenanceBackdropOpacity: payload.maintenanceBackdropOpacity ?? base.maintenanceBackdropOpacity,
    maintenanceTextColor:
      payload.maintenanceTextColor && payload.maintenanceTextColor.trim().length > 0
        ? payload.maintenanceTextColor.startsWith('#')
          ? payload.maintenanceTextColor
          : `#${payload.maintenanceTextColor}`
        : base.maintenanceTextColor,
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
