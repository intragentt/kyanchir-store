import 'server-only';

import { unstable_noStore as noStore } from 'next/cache';
import { z } from 'zod';
import prisma from '@/lib/prisma';

export const YOOKASSA_SETTINGS_KEY = 'payments.yookassa';

export type YookassaMode = 'test' | 'live';

interface YookassaModeSecrets {
  shopId: string;
  secretKey: string;
}

interface YookassaPersistedSettings {
  mode: YookassaMode;
  merchantInn: string;
  merchantFullName: string;
  merchantShortName: string;
  merchantOgrnip: string;
  merchantAddress: string;
  merchantBankName: string;
  merchantBankAccount: string;
  merchantCorrAccount: string;
  merchantBic: string;
  contactEmail: string;
  contactPhone: string;
  receiptEnabled: boolean;
  taxSystemCode: number | null;
  vatCode: number | null;
  returnUrl: string;
  test: YookassaModeSecrets;
  live: YookassaModeSecrets;
}

export interface YookassaModeSummary {
  shopId: string;
  hasSecretKey: boolean;
}

export interface YookassaSettingsView {
  mode: YookassaMode;
  merchantInn: string;
  merchantFullName: string;
  merchantShortName: string;
  merchantOgrnip: string;
  merchantAddress: string;
  merchantBankName: string;
  merchantBankAccount: string;
  merchantCorrAccount: string;
  merchantBic: string;
  contactEmail: string;
  contactPhone: string;
  receiptEnabled: boolean;
  taxSystemCode: number | null;
  vatCode: number | null;
  returnUrl: string;
  test: YookassaModeSummary;
  live: YookassaModeSummary;
}

export interface YookassaSettingsSnapshot {
  settings: YookassaSettingsView;
  updatedAt: Date | null;
}

const numberOrNull = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value), 10);

  return Number.isNaN(parsed) ? null : parsed;
};

const envDefaultReturnUrl = (() => {
  const fromEnv = process.env.YOOKASSA_RETURN_URL?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  const fromNextAuth = process.env.NEXTAUTH_URL?.replace(/\/$/, '');

  if (fromNextAuth) {
    return `${fromNextAuth}/checkout/success`;
  }

  return 'https://kyanchir.ru/checkout/success';
})();

const parseTaxSystem = (value: string | undefined) =>
  numberOrNull(value) ?? null;

const parseVatCode = (value: string | undefined): number | null =>
  numberOrNull(value) ?? 1;

const DEFAULT_SETTINGS: YookassaPersistedSettings = {
  mode: (process.env.YOOKASSA_MODE ?? 'test').toLowerCase() === 'live' ? 'live' : 'test',
  merchantInn: process.env.YOOKASSA_MERCHANT_INN?.trim() || '503125980428',
  merchantFullName:
    process.env.YOOKASSA_MERCHANT_FULL_NAME?.trim() ||
    'ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ КОЛЕСНИКОВА ЯНА РУСЛАНОВНА',
  merchantShortName: '',
  merchantOgrnip: '',
  merchantAddress: '',
  merchantBankName: '',
  merchantBankAccount: '',
  merchantCorrAccount: '',
  merchantBic: '',
  contactEmail: '',
  contactPhone: '',
  receiptEnabled: (process.env.YOOKASSA_RECEIPT_ENABLED ?? 'true').toLowerCase() !== 'false',
  taxSystemCode: parseTaxSystem(process.env.YOOKASSA_TAX_SYSTEM_CODE),
  vatCode: parseVatCode(process.env.YOOKASSA_RECEIPT_VAT_CODE),
  returnUrl: envDefaultReturnUrl,
  test: {
    shopId: process.env.YOOKASSA_TEST_SHOP_ID?.trim() || '',
    secretKey: process.env.YOOKASSA_TEST_SECRET_KEY?.trim() || '',
  },
  live: {
    shopId: process.env.YOOKASSA_SHOP_ID?.trim() || '',
    secretKey: process.env.YOOKASSA_SECRET_KEY?.trim() || '',
  },
};

const partialSettingsSchema = z
  .object({
    mode: z.enum(['test', 'live']).optional(),
    merchantInn: z.string().optional(),
    merchantFullName: z.string().optional(),
    merchantShortName: z.string().optional(),
    merchantOgrnip: z.string().optional(),
    merchantAddress: z.string().optional(),
    merchantBankName: z.string().optional(),
    merchantBankAccount: z.string().optional(),
    merchantCorrAccount: z.string().optional(),
    merchantBic: z.string().optional(),
    contactEmail: z.string().optional(),
    contactPhone: z.string().optional(),
    receiptEnabled: z.boolean().optional(),
    taxSystemCode: z.number().nullable().optional(),
    vatCode: z.number().nullable().optional(),
    returnUrl: z.string().optional(),
    test: z
      .object({
        shopId: z.string().optional(),
        secretKey: z.string().optional(),
      })
      .optional(),
    live: z
      .object({
        shopId: z.string().optional(),
        secretKey: z.string().optional(),
      })
      .optional(),
  })
  .strict();

type PartialPersistedSettings = z.infer<typeof partialSettingsSchema>;

const cloneDefaults = (): YookassaPersistedSettings =>
  JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as YookassaPersistedSettings;

const mergeWithDefaults = (
  partial: PartialPersistedSettings | null,
): YookassaPersistedSettings => {
  const base = cloneDefaults();

  if (!partial) {
    return base;
  }

  if (partial.mode) {
    base.mode = partial.mode;
  }

  const assignString = (
    key: keyof Omit<YookassaPersistedSettings, 'mode' | 'receiptEnabled' | 'taxSystemCode' | 'vatCode' | 'returnUrl' | 'test' | 'live'>,
    value: string | undefined,
  ) => {
    if (value !== undefined) {
      base[key] = value.trim();
    }
  };

  assignString('merchantInn', partial.merchantInn);
  assignString('merchantFullName', partial.merchantFullName);
  assignString('merchantShortName', partial.merchantShortName);
  assignString('merchantOgrnip', partial.merchantOgrnip);
  assignString('merchantAddress', partial.merchantAddress);
  assignString('merchantBankName', partial.merchantBankName);
  assignString('merchantBankAccount', partial.merchantBankAccount);
  assignString('merchantCorrAccount', partial.merchantCorrAccount);
  assignString('merchantBic', partial.merchantBic);
  assignString('contactEmail', partial.contactEmail);
  assignString('contactPhone', partial.contactPhone);

  if (partial.receiptEnabled !== undefined) {
    base.receiptEnabled = partial.receiptEnabled;
  }

  if (partial.taxSystemCode !== undefined) {
    base.taxSystemCode = partial.taxSystemCode;
  }

  if (partial.vatCode !== undefined) {
    base.vatCode = partial.vatCode;
  }

  if (partial.returnUrl !== undefined) {
    base.returnUrl = partial.returnUrl.trim();
  }

  if (partial.test) {
    if (partial.test.shopId !== undefined) {
      base.test.shopId = partial.test.shopId.trim();
    }

    if (partial.test.secretKey !== undefined) {
      base.test.secretKey = partial.test.secretKey;
    }
  }

  if (partial.live) {
    if (partial.live.shopId !== undefined) {
      base.live.shopId = partial.live.shopId.trim();
    }

    if (partial.live.secretKey !== undefined) {
      base.live.secretKey = partial.live.secretKey;
    }
  }

  return base;
};

interface PersistedSnapshot {
  settings: YookassaPersistedSettings;
  updatedAt: Date | null;
}

const loadPersistedSettings = async (): Promise<PersistedSnapshot> => {
  noStore();

  const record = await prisma.systemSetting.findUnique({
    where: { key: YOOKASSA_SETTINGS_KEY },
  });

  if (!record?.value) {
    return { settings: cloneDefaults(), updatedAt: null };
  }

  try {
    const parsed = JSON.parse(record.value) as unknown;
    const result = partialSettingsSchema.safeParse(parsed);

    if (!result.success) {
      console.warn('[YooKassaSettings] Не удалось распарсить сохраненные настройки', result.error);
      return { settings: cloneDefaults(), updatedAt: record.updatedAt };
    }

    return { settings: mergeWithDefaults(result.data), updatedAt: record.updatedAt };
  } catch (error) {
    console.warn('[YooKassaSettings] Ошибка чтения сохраненных настроек', error);
    return { settings: cloneDefaults(), updatedAt: record.updatedAt };
  }
};

const toView = (settings: YookassaPersistedSettings): YookassaSettingsView => ({
  mode: settings.mode,
  merchantInn: settings.merchantInn,
  merchantFullName: settings.merchantFullName,
  merchantShortName: settings.merchantShortName,
  merchantOgrnip: settings.merchantOgrnip,
  merchantAddress: settings.merchantAddress,
  merchantBankName: settings.merchantBankName,
  merchantBankAccount: settings.merchantBankAccount,
  merchantCorrAccount: settings.merchantCorrAccount,
  merchantBic: settings.merchantBic,
  contactEmail: settings.contactEmail,
  contactPhone: settings.contactPhone,
  receiptEnabled: settings.receiptEnabled,
  taxSystemCode: settings.taxSystemCode,
  vatCode: settings.vatCode,
  returnUrl: settings.returnUrl,
  test: {
    shopId: settings.test.shopId,
    hasSecretKey: Boolean(settings.test.secretKey),
  },
  live: {
    shopId: settings.live.shopId,
    hasSecretKey: Boolean(settings.live.secretKey),
  },
});

export const getYookassaSettings = async (): Promise<YookassaSettingsSnapshot> => {
  const snapshot = await loadPersistedSettings();
  return { settings: toView(snapshot.settings), updatedAt: snapshot.updatedAt };
};

const taxSystemCodeSchema = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);

    return Number.isNaN(parsed) ? null : parsed;
  })
  .refine((value) => value === null || (value >= 0 && value <= 6), {
    message: 'Код системы налогообложения должен быть в диапазоне 0–6',
  });

const vatCodeSchema = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    const parsed = typeof value === 'number' ? value : Number.parseInt(value, 10);

    return Number.isNaN(parsed) ? null : parsed;
  })
  .refine((value) => value === null || (value >= 1 && value <= 6), {
    message: 'Код ставки НДС должен быть в диапазоне 1–6',
  });

const optionalString = z.string().trim().optional().default('');

const secretKeyInputSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return '';
    }

    return value.trim();
  });

const updateSchema = z
  .object({
    mode: z.enum(['test', 'live']),
    merchantInn: z
      .string()
      .trim()
      .regex(/^[0-9]{10,12}$/u, 'ИНН должен содержать 10 или 12 цифр'),
    merchantFullName: z.string().trim().min(3, 'Введите полное наименование'),
    merchantShortName: optionalString,
    merchantOgrnip: optionalString,
    merchantAddress: optionalString,
    merchantBankName: optionalString,
    merchantBankAccount: optionalString,
    merchantCorrAccount: optionalString,
    merchantBic: optionalString,
    contactEmail: z
      .string()
      .trim()
      .email('Введите корректный email')
      .optional()
      .or(z.literal(''))
      .transform((value) => value?.trim() ?? ''),
    contactPhone: optionalString,
    receiptEnabled: z.boolean(),
    taxSystemCode: taxSystemCodeSchema,
    vatCode: vatCodeSchema,
    returnUrl: z.string().trim().url('Введите корректный URL'),
    test: z.object({
      shopId: optionalString,
      secretKey: secretKeyInputSchema,
    }),
    live: z.object({
      shopId: optionalString,
      secretKey: secretKeyInputSchema,
    }),
  })
  .strict();

export type UpdateYookassaSettingsInput = z.infer<typeof updateSchema>;

let runtimeCache: YookassaRuntimeConfig | null | undefined;

export interface YookassaRuntimeConfig {
  mode: YookassaMode;
  shopId: string;
  secretKey: string;
  merchantInn: string;
  merchantFullName: string;
  receiptEnabled: boolean;
  returnUrl: string;
  taxSystemCode?: number;
  vatCode?: number;
}

const buildRuntimeConfig = (
  settings: YookassaPersistedSettings,
): YookassaRuntimeConfig | null => {
  const modeSettings = settings[settings.mode];

  if (!modeSettings.shopId || !modeSettings.secretKey) {
    return null;
  }

  const config: YookassaRuntimeConfig = {
    mode: settings.mode,
    shopId: modeSettings.shopId,
    secretKey: modeSettings.secretKey,
    merchantInn: settings.merchantInn,
    merchantFullName: settings.merchantFullName,
    receiptEnabled: settings.receiptEnabled,
    returnUrl: settings.returnUrl,
  };

  if (settings.taxSystemCode !== null && settings.taxSystemCode !== undefined) {
    config.taxSystemCode = settings.taxSystemCode;
  }

  if (settings.vatCode !== null && settings.vatCode !== undefined) {
    config.vatCode = settings.vatCode;
  }

  return config;
};

export const validateYookassaSettingsPayload = (
  input: unknown,
): UpdateYookassaSettingsInput => updateSchema.parse(input);

const clonePersisted = (
  settings: YookassaPersistedSettings,
): YookassaPersistedSettings => ({
  ...settings,
  test: { ...settings.test },
  live: { ...settings.live },
});

export const saveYookassaSettings = async (
  payload: UpdateYookassaSettingsInput,
): Promise<YookassaSettingsSnapshot> => {
  const current = await loadPersistedSettings();
  const next = clonePersisted(current.settings);

  next.mode = payload.mode;
  next.merchantInn = payload.merchantInn;
  next.merchantFullName = payload.merchantFullName;
  next.merchantShortName = payload.merchantShortName;
  next.merchantOgrnip = payload.merchantOgrnip;
  next.merchantAddress = payload.merchantAddress;
  next.merchantBankName = payload.merchantBankName;
  next.merchantBankAccount = payload.merchantBankAccount;
  next.merchantCorrAccount = payload.merchantCorrAccount;
  next.merchantBic = payload.merchantBic;
  next.contactEmail = payload.contactEmail;
  next.contactPhone = payload.contactPhone;
  next.receiptEnabled = payload.receiptEnabled;
  next.taxSystemCode = payload.taxSystemCode;
  next.vatCode = payload.vatCode;
  next.returnUrl = payload.returnUrl;

  next.test.shopId = payload.test.shopId;
  if (payload.test.secretKey !== undefined) {
    next.test.secretKey = payload.test.secretKey;
  }

  next.live.shopId = payload.live.shopId;
  if (payload.live.secretKey !== undefined) {
    next.live.secretKey = payload.live.secretKey;
  }

  const record = await prisma.systemSetting.upsert({
    where: { key: YOOKASSA_SETTINGS_KEY },
    update: { value: JSON.stringify(next) },
    create: { key: YOOKASSA_SETTINGS_KEY, value: JSON.stringify(next) },
  });

  runtimeCache = undefined;

  return { settings: toView(next), updatedAt: record.updatedAt };
};

export const getYookassaRuntimeConfig = async (): Promise<YookassaRuntimeConfig | null> => {
  if (runtimeCache !== undefined) {
    return runtimeCache;
  }

  const snapshot = await loadPersistedSettings();
  runtimeCache = buildRuntimeConfig(snapshot.settings);
  return runtimeCache;
};

export const resetYookassaRuntimeCache = () => {
  runtimeCache = undefined;
};
