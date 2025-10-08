import 'server-only';

import { unstable_noStore as noStore } from 'next/cache';
import { z } from 'zod';
import prisma from '@/lib/prisma';

export type SdekMode = 'test' | 'production';

interface SdekCredentials {
  account: string;
  securePassword: string;
}

interface SdekPersistedSettings {
  mode: SdekMode;
  test: SdekCredentials;
  production: SdekCredentials;
  defaultSenderName: string;
  defaultSenderPhone: string;
  defaultSenderCityCode: number | null;
  defaultSenderAddress: string;
  defaultTariffCode: number | null;
  defaultPackageWeightGrams: number | null;
  webhookSecret: string;
}

export interface SdekModeSummary {
  account: string | null;
  hasSecurePassword: boolean;
}

export interface SdekSettingsView {
  mode: SdekMode;
  test: SdekModeSummary;
  production: SdekModeSummary;
  defaultSenderName: string | null;
  defaultSenderPhone: string | null;
  defaultSenderCityCode: number | null;
  defaultSenderAddress: string | null;
  defaultTariffCode: number | null;
  defaultPackageWeightGrams: number | null;
  webhookSecret: string | null;
}

export interface SdekSettingsSnapshot {
  settings: SdekSettingsView;
  updatedAt: Date | null;
}

const SETTINGS_KEY = 'SDEK_SETTINGS';

const DEFAULT_SETTINGS: SdekPersistedSettings = {
  mode: 'test',
  test: {
    account: '',
    securePassword: '',
  },
  production: {
    account: '',
    securePassword: '',
  },
  defaultSenderName: '',
  defaultSenderPhone: '',
  defaultSenderCityCode: null,
  defaultSenderAddress: '',
  defaultTariffCode: null,
  defaultPackageWeightGrams: null,
  webhookSecret: '',
};

const cloneDefaults = (): SdekPersistedSettings =>
  JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as SdekPersistedSettings;

type PartialPersistedSettings = Omit<
  Partial<SdekPersistedSettings>,
  'test' | 'production'
> & {
  test?: Partial<SdekCredentials>;
  production?: Partial<SdekCredentials>;
};

const mergeWithDefaults = (
  partial: PartialPersistedSettings,
): SdekPersistedSettings => {
  const base = cloneDefaults();

  base.mode = partial.mode ?? base.mode;

  if (partial.test) {
    base.test.account = partial.test.account ?? base.test.account;
    if (partial.test.securePassword !== undefined) {
      base.test.securePassword = partial.test.securePassword;
    }
  }

  if (partial.production) {
    base.production.account = partial.production.account ?? base.production.account;
    if (partial.production.securePassword !== undefined) {
      base.production.securePassword = partial.production.securePassword;
    }
  }

  if (partial.defaultSenderName !== undefined) {
    base.defaultSenderName = partial.defaultSenderName;
  }

  if (partial.defaultSenderPhone !== undefined) {
    base.defaultSenderPhone = partial.defaultSenderPhone;
  }

  if (partial.defaultSenderCityCode !== undefined) {
    base.defaultSenderCityCode = partial.defaultSenderCityCode;
  }

  if (partial.defaultSenderAddress !== undefined) {
    base.defaultSenderAddress = partial.defaultSenderAddress;
  }

  if (partial.defaultTariffCode !== undefined) {
    base.defaultTariffCode = partial.defaultTariffCode;
  }

  if (partial.defaultPackageWeightGrams !== undefined) {
    base.defaultPackageWeightGrams = partial.defaultPackageWeightGrams;
  }

  if (partial.webhookSecret !== undefined) {
    base.webhookSecret = partial.webhookSecret;
  }

  return base;
};

interface PersistedSnapshot {
  settings: SdekPersistedSettings;
  updatedAt: Date | null;
}

const loadPersistedSettings = async (): Promise<PersistedSnapshot> => {
  noStore();

  const record = await prisma.systemSetting.findUnique({
    where: { key: SETTINGS_KEY },
  });

  if (!record?.value) {
    return { settings: cloneDefaults(), updatedAt: null };
  }

  try {
    const parsed = JSON.parse(record.value) as unknown;
    const result = partialSettingsSchema.safeParse(parsed);

    if (!result.success) {
      console.warn('[SdekSettings] Не удалось распарсить сохранённые настройки', result.error);
      return { settings: cloneDefaults(), updatedAt: record.updatedAt };
    }

    return {
      settings: mergeWithDefaults(result.data as PartialPersistedSettings),
      updatedAt: record.updatedAt,
    };
  } catch (error) {
    console.warn('[SdekSettings] Ошибка чтения сохранённых настроек', error);
    return { settings: cloneDefaults(), updatedAt: record.updatedAt };
  }
};

const toView = (settings: SdekPersistedSettings): SdekSettingsView => ({
  mode: settings.mode,
  test: {
    account: settings.test.account || null,
    hasSecurePassword: Boolean(settings.test.securePassword),
  },
  production: {
    account: settings.production.account || null,
    hasSecurePassword: Boolean(settings.production.securePassword),
  },
  defaultSenderName: settings.defaultSenderName || null,
  defaultSenderPhone: settings.defaultSenderPhone || null,
  defaultSenderCityCode: settings.defaultSenderCityCode,
  defaultSenderAddress: settings.defaultSenderAddress || null,
  defaultTariffCode: settings.defaultTariffCode,
  defaultPackageWeightGrams: settings.defaultPackageWeightGrams,
  webhookSecret: settings.webhookSecret || null,
});

export const getSdekSettings = async (): Promise<SdekSettingsSnapshot> => {
  const snapshot = await loadPersistedSettings();
  return { settings: toView(snapshot.settings), updatedAt: snapshot.updatedAt };
};

const trimmedOptionalString = (max: number) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }

      if (value === null) {
        return '';
      }

      const trimmed = value.trim();
      if (trimmed.length > max) {
        throw new Error(`Максимальная длина — ${max} символов`);
      }
      return trimmed;
    });

const optionalPhoneSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return '';
    }

    const trimmed = value.trim();

    if (!trimmed) {
      return '';
    }

    const digits = trimmed.replace(/[^0-9+\-()\s]/gu, '');
    if (digits.length > 32) {
      throw new Error('Телефон не должен превышать 32 символа');
    }

    return digits;
  });

const numericField = z
  .union([z.string(), z.number(), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);

    if (Number.isNaN(parsed)) {
      return null;
    }

    return parsed;
  })
  .refine((value) => value === null || value >= 0, {
    message: 'Значение должно быть неотрицательным числом',
  });

const credentialsSchema = z
  .object({
    account: trimmedOptionalString(64),
    securePassword: trimmedOptionalString(128),
  })
  .partial();

const partialSettingsSchema = z
  .object({
    mode: z.enum(['test', 'production']).optional(),
    test: credentialsSchema.optional(),
    production: credentialsSchema.optional(),
    defaultSenderName: trimmedOptionalString(120),
    defaultSenderPhone: optionalPhoneSchema,
    defaultSenderCityCode: numericField,
    defaultSenderAddress: trimmedOptionalString(160),
    defaultTariffCode: numericField,
    defaultPackageWeightGrams: numericField,
    webhookSecret: trimmedOptionalString(128),
  })
  .partial();

const credentialsUpdateSchema = z
  .object({
    account: z.string().trim().max(64).optional(),
    securePassword: z.string().trim().max(128).optional(),
  })
  .partial();

const updateSchema = z.object({
  mode: z.enum(['test', 'production']),
  test: credentialsUpdateSchema,
  production: credentialsUpdateSchema,
  defaultSenderName: z.string().trim().max(120).optional(),
  defaultSenderPhone: optionalPhoneSchema,
  defaultSenderCityCode: numericField,
  defaultSenderAddress: z.string().trim().max(160).optional(),
  defaultTariffCode: numericField,
  defaultPackageWeightGrams: numericField,
  webhookSecret: z.string().trim().max(128).optional(),
});

export type UpdateSdekSettingsInput = z.infer<typeof updateSchema>;

export const validateSdekSettingsPayload = (
  input: unknown,
): UpdateSdekSettingsInput => {
  const parsed = updateSchema.parse(input);

  const normalizeCredentials = (credentials: Record<string, unknown>) => {
    const result = credentialsUpdateSchema.parse(credentials);
    const mapped: { account?: string; securePassword?: string } = {};

    if (result.account !== undefined) {
      mapped.account = result.account;
    }

    if (result.securePassword !== undefined) {
      mapped.securePassword = result.securePassword;
    }

    return mapped;
  };

  return {
    ...parsed,
    test: normalizeCredentials(parsed.test ?? {}),
    production: normalizeCredentials(parsed.production ?? {}),
  };
};

const buildPersistedSettings = (
  base: SdekPersistedSettings,
  payload: UpdateSdekSettingsInput,
): SdekPersistedSettings => {
  const next = { ...base };

  next.mode = payload.mode;
  next.defaultSenderName = payload.defaultSenderName ?? '';
  next.defaultSenderPhone = payload.defaultSenderPhone ?? '';
  next.defaultSenderCityCode = payload.defaultSenderCityCode ?? null;
  next.defaultSenderAddress = payload.defaultSenderAddress ?? '';
  next.defaultTariffCode = payload.defaultTariffCode ?? null;
  next.defaultPackageWeightGrams = payload.defaultPackageWeightGrams ?? null;
  next.webhookSecret = payload.webhookSecret ?? '';

  if (payload.test.account !== undefined) {
    next.test.account = payload.test.account;
  }

  if (payload.test.securePassword !== undefined) {
    next.test.securePassword = payload.test.securePassword;
  }

  if (payload.production.account !== undefined) {
    next.production.account = payload.production.account;
  }

  if (payload.production.securePassword !== undefined) {
    next.production.securePassword = payload.production.securePassword;
  }

  return next;
};

export const saveSdekSettings = async (
  payload: UpdateSdekSettingsInput,
): Promise<SdekSettingsSnapshot> => {
  const snapshot = await loadPersistedSettings();
  const nextSettings = buildPersistedSettings(snapshot.settings, payload);

  const serialized = JSON.stringify(nextSettings);

  const record = await prisma.systemSetting.upsert({
    where: { key: SETTINGS_KEY },
    update: { value: serialized },
    create: { key: SETTINGS_KEY, value: serialized },
  });

  return { settings: toView(nextSettings), updatedAt: record.updatedAt };
};

export interface SdekRuntimeConfig {
  mode: SdekMode;
  credentials: SdekCredentials;
  defaultSenderName: string | null;
  defaultSenderPhone: string | null;
  defaultSenderCityCode: number | null;
  defaultSenderAddress: string | null;
  defaultTariffCode: number | null;
  defaultPackageWeightGrams: number | null;
  webhookSecret: string | null;
}

let runtimeCache: SdekRuntimeConfig | null | undefined;

export const getSdekRuntimeConfig = async (): Promise<SdekRuntimeConfig | null> => {
  if (runtimeCache !== undefined) {
    return runtimeCache;
  }

  const snapshot = await loadPersistedSettings();
  const { settings } = snapshot;

  const source = settings.mode === 'production' ? settings.production : settings.test;

  if (!source.account || !source.securePassword) {
    runtimeCache = null;
    return runtimeCache;
  }

  runtimeCache = {
    mode: settings.mode,
    credentials: { ...source },
    defaultSenderName: settings.defaultSenderName || null,
    defaultSenderPhone: settings.defaultSenderPhone || null,
    defaultSenderCityCode: settings.defaultSenderCityCode,
    defaultSenderAddress: settings.defaultSenderAddress || null,
    defaultTariffCode: settings.defaultTariffCode,
    defaultPackageWeightGrams: settings.defaultPackageWeightGrams,
    webhookSecret: settings.webhookSecret || null,
  };

  return runtimeCache;
};

export const resetSdekRuntimeCache = () => {
  runtimeCache = undefined;
};
