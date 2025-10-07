import 'server-only';

import { cache } from 'react';
import { unstable_noStore as noStore } from 'next/cache';
import prisma from '@/lib/prisma';
import {
  DESIGN_SYSTEM_KEY,
  DEFAULT_DESIGN_SYSTEM_SETTINGS,
  DEFAULT_FONT_IDS,
  designSystemPartialSchema,
  designSystemSchema,
  type DesignSystemPartial,
  type DesignSystemSettings,
  type FontLibraryEntry,
  ensureFontLibraryIntegrity,
  spacingOrder,
  typographyOrder,
} from './design-system.shared';

export interface DesignSystemSnapshot {
  settings: DesignSystemSettings;
  updatedAt: Date | null;
}

function ensureFontChoice(
  library: DesignSystemSettings['fontLibrary'],
  candidate: string | undefined,
  fallback: string,
) {
  if (candidate && library.some((font) => font.id === candidate)) {
    return candidate;
  }

  if (library.some((font) => font.id === fallback)) {
    return fallback;
  }

  return library[0]?.id ?? fallback;
}

function sanitizeFontLibrary(
  entries: DesignSystemPartial['fontLibrary'],
): FontLibraryEntry[] | null {
  if (!Array.isArray(entries)) {
    return null;
  }

  const validEntries: FontLibraryEntry[] = [];

  for (const entry of entries) {
    if (
      entry &&
      typeof entry.id === 'string' &&
      typeof entry.name === 'string' &&
      typeof entry.family === 'string' &&
      Array.isArray(entry.fallbacks) &&
      typeof entry.category === 'string'
    ) {
      validEntries.push({
        id: entry.id,
        name: entry.name,
        family: entry.family,
        cssUrl: entry.cssUrl,
        fallbacks: entry.fallbacks,
        category: entry.category,
        previewText: entry.previewText,
        isSystem: entry.isSystem,
      });
    }
  }

  return validEntries.length > 0 ? validEntries : null;
}

function mergeWithDefaults(value: DesignSystemPartial | null | undefined): DesignSystemSettings {
  if (!value) {
    return structuredClone(DEFAULT_DESIGN_SYSTEM_SETTINGS);
  }

  const defaults = DEFAULT_DESIGN_SYSTEM_SETTINGS;
  const userLibrary = sanitizeFontLibrary(value.fontLibrary);
  const mergedLibrary = ensureFontLibraryIntegrity(userLibrary ?? defaults.fontLibrary);

  const fonts = {
    heading: ensureFontChoice(mergedLibrary, value.fonts?.heading, DEFAULT_FONT_IDS.heading),
    body: ensureFontChoice(mergedLibrary, value.fonts?.body, DEFAULT_FONT_IDS.body),
    accent: ensureFontChoice(mergedLibrary, value.fonts?.accent, DEFAULT_FONT_IDS.accent),
  } satisfies DesignSystemSettings['fonts'];

  const typography = typographyOrder.reduce((acc, key) => {
    const fallback = defaults.typography[key];
    const override = value.typography?.[key];

    acc[key] = {
      mobile: override?.mobile ?? fallback.mobile,
      desktop: override?.desktop ?? fallback.desktop,
      lineHeight: override?.lineHeight ?? fallback.lineHeight,
      weight: override?.weight ?? fallback.weight,
      letterSpacing:
        override?.letterSpacing === undefined
          ? fallback.letterSpacing
          : override.letterSpacing,
    };

    return acc;
  }, {} as DesignSystemSettings['typography']);

  const spacing = spacingOrder.reduce((acc, key) => {
    acc[key] = value.spacing?.[key] ?? defaults.spacing[key];
    return acc;
  }, {} as DesignSystemSettings['spacing']);

  const colors = Object.keys(defaults.colors).reduce((acc, key) => {
    const typedKey = key as keyof DesignSystemSettings['colors'];
    acc[typedKey] = value.colors?.[typedKey] ?? defaults.colors[typedKey];
    return acc;
  }, {} as DesignSystemSettings['colors']);

  return {
    siteName: value.siteName ?? defaults.siteName,
    colors,
    fonts,
    fontLibrary: mergedLibrary,
    typography,
    spacing,
  };
}

function parseLegacySpacing(value: unknown): number | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (trimmed.endsWith('rem')) {
    const numeric = Number.parseFloat(trimmed.replace('rem', ''));
    if (Number.isFinite(numeric)) {
      return Math.round(numeric * 16);
    }
    return undefined;
  }

  if (trimmed.endsWith('px')) {
    const numeric = Number.parseFloat(trimmed.replace('px', ''));
    if (Number.isFinite(numeric)) {
      return Math.round(numeric);
    }
    return undefined;
  }

  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? Math.round(numeric) : undefined;
}

function convertLegacyPayload(raw: unknown): DesignSystemPartial | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }

  const legacy = raw as Record<string, unknown>;
  const partial: DesignSystemPartial = {};

  if (typeof legacy.siteName === 'string') {
    partial.siteName = legacy.siteName;
  }

  if (typeof legacy.spacing === 'object' && legacy.spacing !== null) {
    partial.spacing = {} as DesignSystemSettings['spacing'];
    for (const key of spacingOrder) {
      const parsed = parseLegacySpacing((legacy.spacing as Record<string, unknown>)[key]);
      if (typeof parsed === 'number') {
        partial.spacing[key] = parsed;
      }
    }
  }

  return Object.keys(partial).length > 0 ? partial : null;
}

function normalizeDesignSystemPayload(raw: unknown): DesignSystemSettings {
  try {
    const parsed = designSystemPartialSchema.parse(raw);
    return mergeWithDefaults(parsed);
  } catch (error) {
    const legacy = convertLegacyPayload(raw);
    if (legacy) {
      return mergeWithDefaults(legacy);
    }
    throw error;
  }
}

function safeParseSettings(value: string | null): DesignSystemSettings {
  if (!value) {
    return structuredClone(DEFAULT_DESIGN_SYSTEM_SETTINGS);
  }

  try {
    const parsed = JSON.parse(value);
    return normalizeDesignSystemPayload(parsed);
  } catch (error) {
    console.error('[DesignSystem] Failed to parse settings, fallback to defaults', error);
    return structuredClone(DEFAULT_DESIGN_SYSTEM_SETTINGS);
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
  return designSystemSchema.parse(input);
}

export { DESIGN_SYSTEM_KEY, DEFAULT_DESIGN_SYSTEM_SETTINGS };
