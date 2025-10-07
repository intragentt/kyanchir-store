import { z } from 'zod';

export type FontCategory =
  | 'sans-serif'
  | 'serif'
  | 'monospace'
  | 'display'
  | 'handwriting';

export interface FontLibraryEntry {
  id: string;
  name: string;
  family: string;
  cssUrl?: string;
  fallbacks: string[];
  category: FontCategory;
  previewText?: string;
  isSystem?: boolean;
}

export interface TypographyToken {
  mobile: number;
  desktop: number;
  lineHeight: number;
  weight: number;
  letterSpacing?: number | null;
}

export type TypographyTokenKey = 'h1' | 'h2' | 'h3' | 'body' | 'small';

export type SpacingTokenKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

export interface DesignSystemColors {
  primary: string;
  primaryForeground: string;
  accent: string;
  accentForeground: string;
  background: string;
  surface: string;
  surfaceForeground: string;
  border: string;
  neutral: string;
  neutralForeground: string;
  muted: string;
  mutedForeground: string;
  textPrimary: string;
  textSecondary: string;
  success: string;
  warning: string;
  danger: string;
}

export interface DesignSystemSettings {
  siteName: string;
  colors: DesignSystemColors;
  fonts: {
    heading: string;
    body: string;
    accent: string;
  };
  fontLibrary: FontLibraryEntry[];
  typography: Record<TypographyTokenKey, TypographyToken>;
  spacing: Record<SpacingTokenKey, number>;
}

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export const fontCategoryOptions: Array<{ value: FontCategory; label: string }> = [
  { value: 'sans-serif', label: 'Sans-serif' },
  { value: 'serif', label: 'Serif' },
  { value: 'display', label: 'Display' },
  { value: 'handwriting', label: 'Handwriting' },
  { value: 'monospace', label: 'Monospace' },
];

export const colorFieldMeta: Record<keyof DesignSystemColors, { label: string; description?: string }> = {
  primary: { label: 'Брендовый цвет' },
  primaryForeground: { label: 'Текст на брендовых элементах' },
  accent: { label: 'Акцентный цвет' },
  accentForeground: { label: 'Текст на акцентах' },
  background: { label: 'Основной фон' },
  surface: { label: 'Поверхности / карточки' },
  surfaceForeground: { label: 'Текст на поверхностях' },
  border: { label: 'Границы и разделители' },
  neutral: { label: 'Нейтральный' },
  neutralForeground: { label: 'Текст на нейтральном фоне' },
  muted: { label: 'Мутный / вторичный' },
  mutedForeground: { label: 'Текст на мутном фоне' },
  textPrimary: { label: 'Основной текст' },
  textSecondary: { label: 'Вторичный текст' },
  success: { label: 'Успех' },
  warning: { label: 'Предупреждение' },
  danger: { label: 'Ошибка' },
};

export const colorSections: Array<{ title: string; keys: Array<keyof DesignSystemColors> }> = [
  { title: 'Бренд и акценты', keys: ['primary', 'primaryForeground', 'accent', 'accentForeground'] },
  { title: 'Фоны и поверхности', keys: ['background', 'surface', 'surfaceForeground', 'border'] },
  { title: 'Текст и нейтральные', keys: ['textPrimary', 'textSecondary', 'neutral', 'neutralForeground', 'muted', 'mutedForeground'] },
  { title: 'Статусы', keys: ['success', 'warning', 'danger'] },
];

export const typographyLabels: Record<TypographyTokenKey, { label: string; sample: string }> = {
  h1: { label: 'Заголовок H1', sample: 'Большой заголовок' },
  h2: { label: 'Заголовок H2', sample: 'Средний заголовок' },
  h3: { label: 'Заголовок H3', sample: 'Малый заголовок' },
  body: { label: 'Основной текст', sample: 'Основной текстовый блок' },
  small: { label: 'Подписи', sample: 'Подпись / пояснение' },
};

export const spacingLabels: Record<SpacingTokenKey, { label: string; hint: string }> = {
  xs: { label: 'XS', hint: 'Минимальные отступы, 4px' },
  sm: { label: 'SM', hint: 'Компактные отступы, 8px' },
  md: { label: 'MD', hint: 'Базовые отступы, 16px' },
  lg: { label: 'LG', hint: 'Крупные отступы, 24px' },
  xl: { label: 'XL', hint: 'Секции, 32px' },
  '2xl': { label: '2XL', hint: 'Крупные блоки, 48px' },
  '3xl': { label: '3XL', hint: 'Герои, 64px' },
};

export const spacingOrder: SpacingTokenKey[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];

export const typographyOrder: TypographyTokenKey[] = ['h1', 'h2', 'h3', 'body', 'small'];

const TYPOGRAPHY_VARIABLES: Record<
  TypographyTokenKey,
  { size: string; lineHeight: string; weight: string; letterSpacing: string }
> = {
  h1: {
    size: '--ds-heading-1-size',
    lineHeight: '--ds-heading-1-line-height',
    weight: '--ds-heading-1-weight',
    letterSpacing: '--ds-heading-1-letter-spacing',
  },
  h2: {
    size: '--ds-heading-2-size',
    lineHeight: '--ds-heading-2-line-height',
    weight: '--ds-heading-2-weight',
    letterSpacing: '--ds-heading-2-letter-spacing',
  },
  h3: {
    size: '--ds-heading-3-size',
    lineHeight: '--ds-heading-3-line-height',
    weight: '--ds-heading-3-weight',
    letterSpacing: '--ds-heading-3-letter-spacing',
  },
  body: {
    size: '--ds-body-font-size',
    lineHeight: '--ds-body-line-height',
    weight: '--ds-body-font-weight',
    letterSpacing: '--ds-body-letter-spacing',
  },
  small: {
    size: '--ds-small-font-size',
    lineHeight: '--ds-small-line-height',
    weight: '--ds-small-font-weight',
    letterSpacing: '--ds-small-letter-spacing',
  },
};

const hexColor = z
  .string()
  .trim()
  .toUpperCase()
  .refine((value) => HEX_COLOR_REGEX.test(value), 'Используйте HEX-формат (#RRGGBB)');

const fontLibraryEntrySchema = z.object({
  id: z
    .string()
    .min(2, 'Минимум 2 символа')
    .max(50, 'Максимум 50 символов')
    .regex(/^[a-z0-9-]+$/i, 'Допустимы латинские буквы, цифры и дефис')
    .transform((value) => value.toLowerCase()),
  name: z
    .string()
    .min(2, 'Название слишком короткое')
    .max(60, 'Название слишком длинное')
    .transform((value) => value.trim()),
  family: z
    .string()
    .min(1, 'Укажите CSS-имя семейства')
    .max(120, 'Слишком длинное имя семейства')
    .transform((value) => value.trim()),
  cssUrl: z
    .string()
    .trim()
    .url('Ссылка должна быть валидной')
    .optional(),
  fallbacks: z.array(
    z
      .string()
      .min(1, 'Fallback не может быть пустым')
      .max(60, 'Слишком длинное название fallback')
      .transform((value) => value.trim()),
  ),
  category: z.custom<FontCategory>((value) =>
    value === 'sans-serif' ||
    value === 'serif' ||
    value === 'monospace' ||
    value === 'display' ||
    value === 'handwriting',
  ),
  previewText: z
    .string()
    .max(120, 'Слишком длинный текст превью')
    .optional(),
  isSystem: z.boolean().optional(),
});

const typographyTokenSchema = z.object({
  mobile: z
    .number({ invalid_type_error: 'Значение должно быть числом' })
    .min(10, 'Минимум 10px')
    .max(120, 'Максимум 120px'),
  desktop: z
    .number({ invalid_type_error: 'Значение должно быть числом' })
    .min(14, 'Минимум 14px')
    .max(180, 'Максимум 180px'),
  lineHeight: z
    .number({ invalid_type_error: 'Значение должно быть числом' })
    .min(1, 'Минимальное значение 1.0')
    .max(2.6, 'Максимальное значение 2.6'),
  weight: z
    .number({ invalid_type_error: 'Используйте значение кратное 100' })
    .int('Насыщенность должна быть целым числом')
    .min(100, 'Минимум 100')
    .max(900, 'Максимум 900'),
  letterSpacing: z
    .number({ invalid_type_error: 'Укажите число в em' })
    .min(-0.4, 'Минимум -0.4em')
    .max(0.4, 'Максимум 0.4em')
    .nullable()
    .optional(),
});

const typographySchema = z.object({
  h1: typographyTokenSchema,
  h2: typographyTokenSchema,
  h3: typographyTokenSchema,
  body: typographyTokenSchema,
  small: typographyTokenSchema,
});

const spacingSchema = z.object({
  xs: z.number({ invalid_type_error: 'Введите число в пикселях' }).min(0).max(96),
  sm: z.number({ invalid_type_error: 'Введите число в пикселях' }).min(0).max(128),
  md: z.number({ invalid_type_error: 'Введите число в пикселях' }).min(0).max(160),
  lg: z.number({ invalid_type_error: 'Введите число в пикселях' }).min(0).max(200),
  xl: z.number({ invalid_type_error: 'Введите число в пикселях' }).min(0).max(240),
  '2xl': z.number({ invalid_type_error: 'Введите число в пикселях' }).min(0).max(320),
  '3xl': z.number({ invalid_type_error: 'Введите число в пикселях' }).min(0).max(400),
});

const colorsSchema = z.object({
  primary: hexColor,
  primaryForeground: hexColor,
  accent: hexColor,
  accentForeground: hexColor,
  background: hexColor,
  surface: hexColor,
  surfaceForeground: hexColor,
  border: hexColor,
  neutral: hexColor,
  neutralForeground: hexColor,
  muted: hexColor,
  mutedForeground: hexColor,
  textPrimary: hexColor,
  textSecondary: hexColor,
  success: hexColor,
  warning: hexColor,
  danger: hexColor,
});

export const designSystemSchema = z.object({
  siteName: z
    .string()
    .min(2, 'Название слишком короткое')
    .max(60, 'Название слишком длинное')
    .transform((value) => value.trim()),
  colors: colorsSchema,
  fonts: z.object({
    heading: z.string().min(1, 'Выберите шрифт для заголовков'),
    body: z.string().min(1, 'Выберите шрифт для основного текста'),
    accent: z.string().min(1, 'Выберите шрифт для акцентов'),
  }),
  fontLibrary: z
    .array(fontLibraryEntrySchema)
    .min(2, 'Добавьте минимум два шрифта'),
  typography: typographySchema,
  spacing: spacingSchema,
});

export const designSystemPartialSchema = designSystemSchema.deepPartial();

export type DesignSystemPartial = z.infer<typeof designSystemPartialSchema>;

export const DESIGN_SYSTEM_KEY = 'DESIGN_SYSTEM';

const DEFAULT_FONT_LIBRARY: FontLibraryEntry[] = [
  {
    id: 'manrope',
    name: 'Manrope',
    family: '"Manrope"',
    cssUrl:
      'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap',
    fallbacks: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
    category: 'sans-serif',
    previewText: 'Съешь ещё этих мягких французских булок',
    isSystem: true,
  },
  {
    id: 'pt-mono',
    name: 'PT Mono',
    family: '"PT Mono"',
    cssUrl: 'https://fonts.googleapis.com/css2?family=PT+Mono&display=swap',
    fallbacks: ['monospace'],
    category: 'monospace',
    previewText: '0123456789 ABCDEF kyanchir.ru',
    isSystem: true,
  },
];

export const DEFAULT_DESIGN_SYSTEM_SETTINGS: DesignSystemSettings = {
  siteName: 'Kyanchir',
  colors: {
    primary: '#6B80C5',
    primaryForeground: '#FFFFFF',
    accent: '#FBC0E3',
    accentForeground: '#272727',
    background: '#FFFFFF',
    surface: '#F7F7FB',
    surfaceForeground: '#272727',
    border: '#E4E4EF',
    neutral: '#3B3B45',
    neutralForeground: '#FFFFFF',
    muted: '#A1A1B3',
    mutedForeground: '#FFFFFF',
    textPrimary: '#272727',
    textSecondary: '#6B80C5',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
  },
  fonts: {
    heading: 'manrope',
    body: 'manrope',
    accent: 'pt-mono',
  },
  fontLibrary: DEFAULT_FONT_LIBRARY,
  typography: {
    h1: {
      mobile: 40,
      desktop: 96,
      lineHeight: 1.1,
      weight: 800,
      letterSpacing: -0.04,
    },
    h2: {
      mobile: 32,
      desktop: 72,
      lineHeight: 1.2,
      weight: 700,
      letterSpacing: -0.02,
    },
    h3: {
      mobile: 26,
      desktop: 48,
      lineHeight: 1.25,
      weight: 600,
      letterSpacing: -0.01,
    },
    body: {
      mobile: 16,
      desktop: 18,
      lineHeight: 1.6,
      weight: 400,
      letterSpacing: 0,
    },
    small: {
      mobile: 14,
      desktop: 14,
      lineHeight: 1.4,
      weight: 500,
      letterSpacing: 0,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
};

export function pxToRem(px: number): string {
  return `${(px / 16).toFixed(4)}rem`;
}

export function buildFluidSize(mobilePx: number, desktopPx: number): string {
  const minViewport = 320;
  const maxViewport = 1440;
  const slope = (desktopPx - mobilePx) / (maxViewport - minViewport);
  const slopeVW = slope * 100;
  const interceptPx = mobilePx - slope * minViewport;

  const minRem = (mobilePx / 16).toFixed(4);
  const maxRem = (desktopPx / 16).toFixed(4);
  const interceptRem = (interceptPx / 16).toFixed(4);
  const slopeVWFixed = slopeVW.toFixed(4);

  return `clamp(${minRem}rem, ${interceptRem}rem + ${slopeVWFixed}vw, ${maxRem}rem)`;
}

export function formatLetterSpacing(value?: number | null): string {
  if (value === undefined || value === null) {
    return 'normal';
  }

  if (value === 0) {
    return '0em';
  }

  return `${Number(value.toFixed(3))}em`;
}

export function ensureFontLibraryIntegrity(library: FontLibraryEntry[]): FontLibraryEntry[] {
  const map = new Map<string, FontLibraryEntry>();
  for (const entry of library) {
    map.set(entry.id, { ...entry });
  }

  for (const entry of DEFAULT_FONT_LIBRARY) {
    if (!map.has(entry.id)) {
      map.set(entry.id, { ...entry });
    }
  }

  return Array.from(map.values());
}

export function getFontById(library: FontLibraryEntry[], id: string): FontLibraryEntry | undefined {
  return library.find((item) => item.id === id);
}

export function defaultFallbacksFor(category: FontCategory): string[] {
  switch (category) {
    case 'monospace':
      return ['monospace'];
    case 'serif':
      return ['serif'];
    case 'display':
    case 'handwriting':
      return ['"Segoe UI"', 'sans-serif'];
    default:
      return ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'];
  }
}

export function buildFontStack(entry: FontLibraryEntry): string {
  const fallbacks = entry.fallbacks.length > 0 ? entry.fallbacks : defaultFallbacksFor(entry.category);
  return [entry.family, ...fallbacks].join(', ');
}

export function resolveFontStack(
  library: FontLibraryEntry[],
  id: string,
  fallbackId: string,
): string {
  const entry = getFontById(library, id) ?? getFontById(library, fallbackId);
  if (entry) {
    return buildFontStack(entry);
  }

  const fallback = getFontById(DEFAULT_FONT_LIBRARY, fallbackId) ?? DEFAULT_FONT_LIBRARY[0];
  return buildFontStack(fallback);
}

export function buildDesignSystemVariableMap(settings: DesignSystemSettings): Record<string, string> {
  const library = ensureFontLibraryIntegrity(settings.fontLibrary);
  const headingStack = resolveFontStack(library, settings.fonts.heading, 'manrope');
  const bodyStack = resolveFontStack(library, settings.fonts.body, 'manrope');
  const accentStack = resolveFontStack(library, settings.fonts.accent, 'pt-mono');

  const typographyVars: Record<string, string> = {};
  for (const key of typographyOrder) {
    const token = settings.typography[key];
    const variables = TYPOGRAPHY_VARIABLES[key];
    typographyVars[variables.size] = buildFluidSize(token.mobile, token.desktop);
    typographyVars[variables.lineHeight] = `${token.lineHeight}`;
    typographyVars[variables.weight] = `${token.weight}`;
    typographyVars[variables.letterSpacing] = formatLetterSpacing(token.letterSpacing);
  }

  const spacingVars: Record<string, string> = {
    '--ds-spacing-xs': pxToRem(settings.spacing.xs),
    '--ds-spacing-sm': pxToRem(settings.spacing.sm),
    '--ds-spacing-md': pxToRem(settings.spacing.md),
    '--ds-spacing-lg': pxToRem(settings.spacing.lg),
    '--ds-spacing-xl': pxToRem(settings.spacing.xl),
    '--ds-spacing-2xl': pxToRem(settings.spacing['2xl']),
    '--ds-spacing-3xl': pxToRem(settings.spacing['3xl']),
  };

  const colorVars: Record<string, string> = {
    '--ds-color-primary': settings.colors.primary,
    '--ds-color-primary-foreground': settings.colors.primaryForeground,
    '--ds-color-accent': settings.colors.accent,
    '--ds-color-accent-foreground': settings.colors.accentForeground,
    '--ds-color-background': settings.colors.background,
    '--ds-color-surface': settings.colors.surface,
    '--ds-color-surface-foreground': settings.colors.surfaceForeground,
    '--ds-color-border': settings.colors.border,
    '--ds-color-neutral': settings.colors.neutral,
    '--ds-color-neutral-foreground': settings.colors.neutralForeground,
    '--ds-color-muted': settings.colors.muted,
    '--ds-color-muted-foreground': settings.colors.mutedForeground,
    '--ds-color-text-primary': settings.colors.textPrimary,
    '--ds-color-text-secondary': settings.colors.textSecondary,
    '--ds-color-success': settings.colors.success,
    '--ds-color-warning': settings.colors.warning,
    '--ds-color-danger': settings.colors.danger,
  };

  return {
    '--ds-font-heading': headingStack,
    '--ds-font-body': bodyStack,
    '--ds-font-accent': accentStack,
    ...typographyVars,
    ...spacingVars,
    ...colorVars,
  };
}

export function collectFontCssLinks(library: FontLibraryEntry[]): string[] {
  const seen = new Set<string>();
  const links: string[] = [];

  for (const entry of ensureFontLibraryIntegrity(library)) {
    if (entry.cssUrl && !seen.has(entry.cssUrl)) {
      seen.add(entry.cssUrl);
      links.push(entry.cssUrl);
    }
  }

  return links;
}

export function slugifyFontId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export const DEFAULT_FONT_IDS = {
  heading: 'manrope',
  body: 'manrope',
  accent: 'pt-mono',
};

