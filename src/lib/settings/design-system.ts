import 'server-only';

import { cache } from 'react';
import { unstable_noStore as noStore } from 'next/cache';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const DESIGN_SYSTEM_KEY = 'DESIGN_SYSTEM';

const fontStackSchema = z.object({
  stack: z
    .string()
    .min(1, 'Укажите хотя бы один шрифт')
    .max(300, 'Слишком длинное значение стека шрифтов')
    .transform((value) => value.trim()),
  source: z
    .string()
    .trim()
    .url('Источник должен быть ссылкой')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});

const typographyTokenSchema = z.object({
  size: z
    .string()
    .min(1, 'Размер обязателен')
    .max(40, 'Слишком длинное значение размера')
    .transform((value) => value.trim()),
  lineHeight: z
    .string()
    .min(1, 'Укажите line-height')
    .max(40, 'Слишком длинное значение line-height')
    .transform((value) => value.trim()),
  weight: z
    .string()
    .min(1, 'Укажите насыщенность')
    .max(12, 'Слишком длинное значение насыщенности')
    .transform((value) => value.trim()),
  letterSpacing: z
    .string()
    .max(20, 'Слишком длинное значение трекинга')
    .transform((value) => value.trim())
    .optional(),
});

const spacingSchema = z.object({
  xs: z
    .string()
    .min(1)
    .max(15)
    .transform((value) => value.trim()),
  sm: z
    .string()
    .min(1)
    .max(15)
    .transform((value) => value.trim()),
  md: z
    .string()
    .min(1)
    .max(15)
    .transform((value) => value.trim()),
  lg: z
    .string()
    .min(1)
    .max(15)
    .transform((value) => value.trim()),
  xl: z
    .string()
    .min(1)
    .max(15)
    .transform((value) => value.trim()),
  '2xl': z
    .string()
    .min(1)
    .max(15)
    .transform((value) => value.trim()),
  '3xl': z
    .string()
    .min(1)
    .max(15)
    .transform((value) => value.trim()),
});

const designSystemSchema = z.object({
  siteName: z
    .string()
    .min(2, 'Название сайта должно быть длиннее')
    .max(60, 'Название сайта слишком длинное')
    .transform((value) => value.trim()),
  fonts: z.object({
    heading: fontStackSchema,
    body: fontStackSchema,
    accent: fontStackSchema,
  }),
  typography: z.object({
    h1: typographyTokenSchema,
    h2: typographyTokenSchema,
    h3: typographyTokenSchema,
    body: typographyTokenSchema,
    small: typographyTokenSchema,
  }),
  spacing: spacingSchema,
});

export type DesignSystemSettings = z.infer<typeof designSystemSchema>;

export interface DesignSystemSnapshot {
  settings: DesignSystemSettings;
  updatedAt: Date | null;
}

export const DEFAULT_DESIGN_SYSTEM_SETTINGS: DesignSystemSettings = {
  siteName: 'Kyanchir',
  fonts: {
    heading: {
      stack: 'var(--font-heading), "Unbounded", sans-serif',
    },
    body: {
      stack: 'var(--font-body), "Manrope", sans-serif',
    },
    accent: {
      stack: 'var(--font-mono), "PT Mono", monospace',
    },
  },
  typography: {
    h1: {
      size: 'clamp(2rem, 6vw + 1rem, 6rem)',
      lineHeight: '1.1',
      weight: '900',
      letterSpacing: '-0.03em',
    },
    h2: {
      size: 'clamp(1.75rem, 4vw + 0.5rem, 3.75rem)',
      lineHeight: '1.2',
      weight: '800',
      letterSpacing: '-0.02em',
    },
    h3: {
      size: 'clamp(1.3rem, 3vw + 0.5rem, 2.5rem)',
      lineHeight: '1.2',
      weight: '700',
      letterSpacing: '-0.01em',
    },
    body: {
      size: 'clamp(1rem, 0.8vw + 0.5rem, 1.125rem)',
      lineHeight: '1.6',
      weight: '400',
      letterSpacing: '0em',
    },
    small: {
      size: '0.875rem',
      lineHeight: '1.45',
      weight: '500',
      letterSpacing: '0em',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
};

function mergeWithDefaults(
  value: Partial<DesignSystemSettings> | null | undefined,
): DesignSystemSettings {
  if (!value) {
    return { ...DEFAULT_DESIGN_SYSTEM_SETTINGS };
  }

  return {
    siteName: value.siteName ?? DEFAULT_DESIGN_SYSTEM_SETTINGS.siteName,
    fonts: {
      heading: {
        stack:
          value.fonts?.heading?.stack ??
          DEFAULT_DESIGN_SYSTEM_SETTINGS.fonts.heading.stack,
        source: value.fonts?.heading?.source,
      },
      body: {
        stack:
          value.fonts?.body?.stack ?? DEFAULT_DESIGN_SYSTEM_SETTINGS.fonts.body.stack,
        source: value.fonts?.body?.source,
      },
      accent: {
        stack:
          value.fonts?.accent?.stack ??
          DEFAULT_DESIGN_SYSTEM_SETTINGS.fonts.accent.stack,
        source: value.fonts?.accent?.source,
      },
    },
    typography: {
      h1: { ...DEFAULT_DESIGN_SYSTEM_SETTINGS.typography.h1, ...value.typography?.h1 },
      h2: { ...DEFAULT_DESIGN_SYSTEM_SETTINGS.typography.h2, ...value.typography?.h2 },
      h3: { ...DEFAULT_DESIGN_SYSTEM_SETTINGS.typography.h3, ...value.typography?.h3 },
      body: {
        ...DEFAULT_DESIGN_SYSTEM_SETTINGS.typography.body,
        ...value.typography?.body,
      },
      small: {
        ...DEFAULT_DESIGN_SYSTEM_SETTINGS.typography.small,
        ...value.typography?.small,
      },
    },
    spacing: {
      xs: value.spacing?.xs ?? DEFAULT_DESIGN_SYSTEM_SETTINGS.spacing.xs,
      sm: value.spacing?.sm ?? DEFAULT_DESIGN_SYSTEM_SETTINGS.spacing.sm,
      md: value.spacing?.md ?? DEFAULT_DESIGN_SYSTEM_SETTINGS.spacing.md,
      lg: value.spacing?.lg ?? DEFAULT_DESIGN_SYSTEM_SETTINGS.spacing.lg,
      xl: value.spacing?.xl ?? DEFAULT_DESIGN_SYSTEM_SETTINGS.spacing.xl,
      '2xl': value.spacing?.['2xl'] ?? DEFAULT_DESIGN_SYSTEM_SETTINGS.spacing['2xl'],
      '3xl': value.spacing?.['3xl'] ?? DEFAULT_DESIGN_SYSTEM_SETTINGS.spacing['3xl'],
    },
  };
}

function safeParseSettings(value: string | null): DesignSystemSettings {
  if (!value) {
    return { ...DEFAULT_DESIGN_SYSTEM_SETTINGS };
  }

  try {
    const parsed = JSON.parse(value);
    const result = designSystemSchema.deepPartial().parse(parsed);
    return mergeWithDefaults(result);
  } catch (error) {
    console.error('[DesignSystem] Failed to parse settings, fallback to defaults', error);
    return { ...DEFAULT_DESIGN_SYSTEM_SETTINGS };
  }
}

export const getDesignSystemSettings = cache(async (): Promise<DesignSystemSnapshot> => {
  noStore();

  const record = await prisma.systemSetting.findUnique({
    where: { key: DESIGN_SYSTEM_KEY },
  });

  const settings = safeParseSettings(record?.value ?? null);

  return {
    settings,
    updatedAt: record?.updatedAt ?? null,
  };
});

export async function saveDesignSystemSettings(
  payload: DesignSystemSettings,
): Promise<DesignSystemSnapshot> {
  const normalized = designSystemSchema.parse(payload);

  const record = await prisma.systemSetting.upsert({
    where: { key: DESIGN_SYSTEM_KEY },
    update: { value: JSON.stringify(normalized) },
    create: { key: DESIGN_SYSTEM_KEY, value: JSON.stringify(normalized) },
  });

  return {
    settings: mergeWithDefaults(normalized),
    updatedAt: record.updatedAt,
  };
}

export function validateDesignSystemPayload(input: unknown): DesignSystemSettings {
  const parsed = designSystemSchema.parse(input);
  return parsed;
}

export { DESIGN_SYSTEM_KEY };
