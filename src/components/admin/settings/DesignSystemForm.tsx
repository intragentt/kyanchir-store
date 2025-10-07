'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType, CSSProperties } from 'react';
import { toast } from 'react-hot-toast';
import { LoadingButton } from '@/components/shared/ui';
import { cn } from '@/lib/utils';
import type {
  DesignSystemSettings,
  FontLibraryEntry,
  SpacingTokenKey,
  TypographyTokenKey,
} from '@/lib/settings/design-system.shared';
import {
  buildDesignSystemVariableMap,
  buildFontStack,
  colorFieldMeta,
  colorSections,
  defaultFallbacksFor,
  fontCategoryOptions,
  pxToRem,
  slugifyFontId,
  spacingLabels,
  spacingOrder,
  typographyLabels,
  typographyOrder,
} from '@/lib/settings/design-system.shared';
import * as sharedIcons from '@/components/shared/icons';

interface DesignSystemFormProps {
  initialSettings: DesignSystemSettings;
  defaultSettings: DesignSystemSettings;
}

const weightOptions = [100, 200, 300, 400, 500, 600, 700, 800, 900];

const defaultPreviewText = 'Съешь ещё этих мягких французских булок';

function cloneSettings(settings: DesignSystemSettings) {
  if (typeof structuredClone === 'function') {
    return structuredClone(settings);
  }

  return JSON.parse(JSON.stringify(settings)) as DesignSystemSettings;
}

function parseGoogleFontsFamily(url: string): string | null {
  try {
    const parsed = new URL(url);
    const families = parsed.searchParams.getAll('family');
    if (families.length === 0) {
      return null;
    }

    const primary = families[0]?.split(':')[0];
    if (!primary) {
      return null;
    }

    return primary.replace(/\+/g, ' ');
  } catch (error) {
    console.warn('[DesignSystem] Не удалось распарсить ссылку Google Fonts', error);
    return null;
  }
}

function asCssFamily(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'sans-serif';
  }

  return /\s/.test(trimmed) ? `"${trimmed}"` : trimmed;
}

function useDesignSystemState(initial: DesignSystemSettings) {
  const [settings, setSettings] = useState<DesignSystemSettings>(cloneSettings(initial));
  const [snapshot, setSnapshot] = useState<DesignSystemSettings>(cloneSettings(initial));

  useEffect(() => {
    setSettings(cloneSettings(initial));
    setSnapshot(cloneSettings(initial));
  }, [initial]);

  const isDirty = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(snapshot),
    [settings, snapshot],
  );

  return {
    settings,
    setSettings,
    snapshot,
    setSnapshot,
    isDirty,
  } as const;
}

export default function DesignSystemForm({
  initialSettings,
  defaultSettings,
}: DesignSystemFormProps) {
  const { settings, setSettings, snapshot, setSnapshot, isDirty } =
    useDesignSystemState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [newFontName, setNewFontName] = useState('');
  const [newFontUrl, setNewFontUrl] = useState('');
  const [newFontCategory, setNewFontCategory] = useState(fontCategoryOptions[0]?.value ?? 'sans-serif');
  const [newFontPreview, setNewFontPreview] = useState(defaultPreviewText);
  const iconRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [iconMarkup, setIconMarkup] = useState<Record<string, string>>({});

  const iconEntries = useMemo(() => {
    return Object.entries(sharedIcons)
      .filter((entry): entry is [string, ComponentType<Record<string, any>>] => {
        const [, component] = entry;
        return typeof component === 'function';
      })
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, []);

  useEffect(() => {
    const nextMarkup: Record<string, string> = {};

    for (const [name] of iconEntries) {
      const container = iconRefs.current[name];
      if (!container) continue;

      const svgElement = container.querySelector('svg');
      if (!svgElement) continue;

      nextMarkup[name] = svgElement.outerHTML;
    }

    setIconMarkup((prev) => {
      const hasChanges = iconEntries.some(([name]) => prev[name] !== nextMarkup[name]);
      return hasChanges ? nextMarkup : prev;
    });
  }, [iconEntries]);

  const designSystemStyle = useMemo(() => {
    const map = buildDesignSystemVariableMap(settings);
    return Object.entries(map).reduce((acc, [key, value]) => {
      (acc as Record<string, string>)[key] = value;
      return acc;
    }, {} as CSSProperties);
  }, [settings]);

  const fontOptions = useMemo(
    () =>
      settings.fontLibrary.map((font) => ({
        value: font.id,
        label: font.name,
      })),
    [settings.fontLibrary],
  );

  const handleSiteNameChange = useCallback((value: string) => {
    setSettings((prev) => ({ ...prev, siteName: value }));
  }, []);

  const handleColorChange = useCallback(
    (key: keyof DesignSystemSettings['colors'], value: string) => {
      const formatted = value.startsWith('#') ? value.toUpperCase() : `#${value.toUpperCase()}`;
      setSettings((prev) => ({
        ...prev,
        colors: { ...prev.colors, [key]: formatted.slice(0, 9) },
      }));
    },
    [],
  );

  const handleSpacingChange = useCallback((key: SpacingTokenKey, value: number) => {
    if (Number.isNaN(value)) return;
    setSettings((prev) => ({
      ...prev,
      spacing: { ...prev.spacing, [key]: Math.max(0, Math.round(value)) },
    }));
  }, []);

  const handleTypographyChange = useCallback(
    (
      token: TypographyTokenKey,
      field: keyof DesignSystemSettings['typography'][TypographyTokenKey],
      value: number,
    ) => {
      if (Number.isNaN(value)) return;
      setSettings((prev) => ({
        ...prev,
        typography: {
          ...prev.typography,
          [token]: {
            ...prev.typography[token],
            [field]:
              field === 'letterSpacing'
                ? Number(value.toFixed(2))
                : field === 'lineHeight'
                  ? Number(value.toFixed(2))
                  : Math.round(value),
          },
        },
      }));
    },
    [],
  );

  const handleTypographyLetterSpacing = useCallback(
    (token: TypographyTokenKey, value: number) => {
      if (Number.isNaN(value)) return;
      setSettings((prev) => ({
        ...prev,
        typography: {
          ...prev.typography,
          [token]: {
            ...prev.typography[token],
            letterSpacing: Number(value.toFixed(3)),
          },
        },
      }));
    },
    [],
  );

  const handleFontAssignment = useCallback(
    (role: keyof DesignSystemSettings['fonts'], id: string) => {
      setSettings((prev) => ({
        ...prev,
        fonts: {
          ...prev.fonts,
          [role]: id,
        },
      }));
    },
    [],
  );

  const handleFontMetadataChange = useCallback(
    (id: string, field: keyof FontLibraryEntry, value: string) => {
      setSettings((prev) => ({
        ...prev,
        fontLibrary: prev.fontLibrary.map((font) =>
          font.id === id
            ? {
                ...font,
                [field]:
                  field === 'fallbacks'
                    ? value.split(',').map((item) => item.trim()).filter(Boolean)
                    : value.trim(),
              }
            : font,
        ),
      }));
    },
    [],
  );

  const handleFontPreviewChange = useCallback(
    (id: string, preview: string) => {
      setSettings((prev) => ({
        ...prev,
        fontLibrary: prev.fontLibrary.map((font) =>
          font.id === id
            ? {
                ...font,
                previewText: preview,
              }
            : font,
        ),
      }));
    },
    [],
  );

  const handleRemoveFont = useCallback((id: string) => {
    setSettings((prev) => {
      const nextLibrary = prev.fontLibrary.filter((font) => font.id !== id);
      const ensureAssignment = (current: string, fallback: keyof DesignSystemSettings['fonts']) => {
        if (nextLibrary.some((font) => font.id === current)) {
          return current;
        }
        return defaultSettings.fonts[fallback];
      };

      return {
        ...prev,
        fontLibrary: nextLibrary,
        fonts: {
          heading: ensureAssignment(prev.fonts.heading, 'heading'),
          body: ensureAssignment(prev.fonts.body, 'body'),
          accent: ensureAssignment(prev.fonts.accent, 'accent'),
        },
      };
    });
  }, [defaultSettings.fonts]);

  const handleAddFont = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();

      const familyFromUrl = parseGoogleFontsFamily(newFontUrl);
      const familyName = (newFontName || familyFromUrl)?.trim();

      if (!familyName) {
        toast.error('Укажите название шрифта или корректную ссылку Google Fonts');
        return;
      }

      const id = slugifyFontId(familyName);
      if (!id) {
        toast.error('Не удалось сформировать идентификатор шрифта');
        return;
      }

      const cssFamily = asCssFamily(familyFromUrl ?? familyName);
      const fallbacks = defaultFallbacksFor(newFontCategory);

      const entry: FontLibraryEntry = {
        id,
        name: familyName,
        family: cssFamily,
        cssUrl: newFontUrl || undefined,
        fallbacks,
        category: newFontCategory,
        previewText: newFontPreview || defaultPreviewText,
      };

      setSettings((prev) => {
        const exists = prev.fontLibrary.some((font) => font.id === id);
        const fontLibrary = exists
          ? prev.fontLibrary.map((font) => (font.id === id ? { ...font, ...entry } : font))
          : [...prev.fontLibrary, entry];

        return {
          ...prev,
          fontLibrary,
        };
      });

      toast.success('Шрифт добавлен в библиотеку');
      setNewFontName('');
      setNewFontUrl('');
      setNewFontCategory(fontCategoryOptions[0]?.value ?? 'sans-serif');
      setNewFontPreview(defaultPreviewText);
    },
    [newFontCategory, newFontName, newFontPreview, newFontUrl],
  );

  const handleResetToDefaults = useCallback(() => {
    setSettings(cloneSettings(defaultSettings));
  }, [defaultSettings]);

  const handleRevert = useCallback(() => {
    setSettings(cloneSettings(snapshot));
  }, [snapshot]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSaving(true);

      try {
        const response = await fetch('/api/admin/settings/design-system', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error ?? 'Не удалось сохранить дизайн-систему');
        }

        if (!data?.data) {
          throw new Error('Сервер не вернул данные дизайн-системы');
        }

        const nextSettings = cloneSettings(data.data as DesignSystemSettings);
        setSettings(nextSettings);
        setSnapshot(nextSettings);
        toast.success('Дизайн-система обновлена');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Неизвестная ошибка сохранения';
        toast.error(message);
      } finally {
        setIsSaving(false);
      }
    },
    [settings, setSnapshot],
  );

  const handleCopyIconMarkup = useCallback(async (name: string) => {
    const svg = iconMarkup[name];
    if (!svg) {
      toast.error('SVG ещё не готов — попробуйте позже');
      return;
    }

    try {
      await navigator.clipboard.writeText(svg);
      toast.success('SVG скопирован в буфер обмена');
    } catch (error) {
      console.error('[DesignSystem] Не удалось скопировать SVG', error);
      toast.error('Не удалось скопировать SVG');
    }
  }, [iconMarkup]);

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Управление дизайн-системой</h2>
          <p className="text-sm text-gray-600">
            Здесь собраны все ключевые токены: цвета, типографика, отступы, шрифты и иконки.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:text-gray-900"
          >
            Сбросить к дефолту
          </button>
          <button
            type="button"
            onClick={handleRevert}
            disabled={!isDirty}
            className={cn(
              'rounded-md border border-gray-300 px-4 py-2 text-sm font-medium transition',
              isDirty
                ? 'text-gray-700 hover:border-gray-400 hover:text-gray-900'
                : 'cursor-not-allowed text-gray-400',
            )}
          >
            Отменить изменения
          </button>
          <LoadingButton
            type="submit"
            isLoading={isSaving}
            disabled={!isDirty}
            className={cn(
              'bg-gray-900 text-white hover:bg-gray-800',
              !isDirty && !isSaving && 'cursor-not-allowed opacity-60',
            )}
          >
            Сохранить
          </LoadingButton>
        </div>
      </div>

      <section className="grid gap-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Идентика проекта</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col space-y-1">
            <span className="text-sm font-medium text-gray-700">Название сайта</span>
            <input
              type="text"
              value={settings.siteName}
              onChange={(event) => handleSiteNameChange(event.target.value)}
              placeholder="Например: Kyanchir"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
              maxLength={60}
            />
            <span className="text-xs text-gray-500">Используется в мета-тегах и шапке сайта</span>
          </label>
        </div>
      </section>

      <section className="grid gap-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Цветовая палитра</h3>
          <p className="mt-1 text-sm text-gray-600">
            Задайте цвета бренда, фонов, текста и сервисных состояний. Все значения сохраняются в HEX.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {colorSections.map((section) => (
            <div key={section.title} className="space-y-4 rounded-md border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">{section.title}</p>
              <div className="grid gap-4">
                {section.keys.map((key) => (
                  <div key={key} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-sm font-medium text-gray-700">
                        {colorFieldMeta[key].label}
                      </label>
                      <input
                        type="color"
                        value={settings.colors[key]}
                        onChange={(event) => handleColorChange(key, event.target.value)}
                        className="h-9 w-12 cursor-pointer rounded border border-gray-200"
                        aria-label={`Выбор цвета ${colorFieldMeta[key].label}`}
                      />
                    </div>
                    <input
                      type="text"
                      value={settings.colors[key]}
                      onChange={(event) => handleColorChange(key, event.target.value)}
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm uppercase focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                    <div
                      className="h-10 rounded-md border border-gray-200"
                      style={{ backgroundColor: settings.colors[key] }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Библиотека шрифтов</h3>
          <p className="text-sm text-gray-600">
            Добавляйте шрифты через ссылки Google Fonts: мы автоматически определим семейство и подключим его к
            проекту. Затем выберите, какой шрифт использовать для заголовков, текста и акцентных элементов.
          </p>
          <form onSubmit={handleAddFont} className="grid gap-4 rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Название шрифта</label>
              <input
                value={newFontName}
                onChange={(event) => setNewFontName(event.target.value)}
                placeholder="Например, Space Grotesk"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Ссылка на Google Fonts</label>
              <input
                value={newFontUrl}
                onChange={(event) => setNewFontUrl(event.target.value)}
                placeholder="https://fonts.googleapis.com/css2?family=..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Категория</label>
              <select
                value={newFontCategory}
                onChange={(event) => setNewFontCategory(event.target.value as FontLibraryEntry['category'])}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                {fontCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Текст для предпросмотра</label>
              <input
                value={newFontPreview}
                onChange={(event) => setNewFontPreview(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Добавить шрифт
              </button>
            </div>
          </form>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {settings.fontLibrary.map((font) => (
            <div key={font.id} className="flex flex-col gap-3 rounded-md border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">Отображаемое имя</label>
                  <input
                    value={font.name}
                    onChange={(event) => handleFontMetadataChange(font.id, 'name', event.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                </div>
                {!font.isSystem && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFont(font.id)}
                    className="text-xs font-semibold text-red-500 transition hover:text-red-600"
                  >
                    Удалить
                  </button>
                )}
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-medium text-gray-500">CSS family</label>
                <input
                  value={font.family}
                  onChange={(event) => handleFontMetadataChange(font.id, 'family', event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-medium text-gray-500">Fallback (через запятую)</label>
                <input
                  value={font.fallbacks.join(', ')}
                  onChange={(event) => handleFontMetadataChange(font.id, 'fallbacks', event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </div>
              {font.cssUrl && (
                <a
                  href={font.cssUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-gray-500 underline hover:text-gray-700"
                >
                  Открыть источник Google Fonts
                </a>
              )}
              <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-3">
                <p className="text-xs font-medium text-gray-500">Превью</p>
                <p style={{ fontFamily: buildFontStack(font) }} className="mt-2 text-base text-gray-900">
                  {font.previewText || defaultPreviewText}
                </p>
                <textarea
                  value={font.previewText ?? ''}
                  onChange={(event) => handleFontPreviewChange(font.id, event.target.value)}
                  className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-4 rounded-md border border-gray-100 bg-gray-50 p-4 md:grid-cols-3">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-900">Назначение шрифтов</p>
            <p className="text-xs text-gray-600">
              Выберите, какие шрифты из библиотеки будут использоваться для разных ролей.
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Заголовки</label>
            <select
              value={settings.fonts.heading}
              onChange={(event) => handleFontAssignment('heading', event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              {fontOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Основной текст</label>
            <select
              value={settings.fonts.body}
              onChange={(event) => handleFontAssignment('body', event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              {fontOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Акцент / моно</label>
            <select
              value={settings.fonts.accent}
              onChange={(event) => handleFontAssignment('accent', event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              {fontOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Типографика</h3>
          <p className="mt-1 text-sm text-gray-600">
            Укажите размеры для мобильного и десктопа, line-height и насыщенность. Мы автоматически построим fluid-типографику.
          </p>
        </div>
        <div className="grid gap-4">
          {typographyOrder.map((tokenKey) => {
            const token = settings.typography[tokenKey];
            return (
              <div key={tokenKey} className="grid gap-3 rounded-md border border-gray-100 bg-gray-50 p-4 md:grid-cols-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-900">{typographyLabels[tokenKey].label}</p>
                  <p className="text-xs text-gray-500">{typographyLabels[tokenKey].sample}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Мобильный (px)</label>
                  <input
                    type="number"
                    value={token.mobile}
                    min={10}
                    max={160}
                    onChange={(event) =>
                      handleTypographyChange(tokenKey, 'mobile', Number(event.target.value))
                    }
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600">Десктоп (px)</label>
                  <input
                    type="number"
                    value={token.desktop}
                    min={12}
                    max={200}
                    onChange={(event) =>
                      handleTypographyChange(tokenKey, 'desktop', Number(event.target.value))
                    }
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Line-height</label>
                    <input
                      type="number"
                      step={0.05}
                      value={token.lineHeight}
                      min={1}
                      max={2.6}
                      onChange={(event) =>
                        handleTypographyChange(tokenKey, 'lineHeight', Number(event.target.value))
                      }
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Насыщенность</label>
                    <select
                      value={token.weight}
                      onChange={(event) =>
                        handleTypographyChange(tokenKey, 'weight', Number(event.target.value))
                      }
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                      {weightOptions.map((weight) => (
                        <option key={weight} value={weight}>
                          {weight}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-medium text-gray-600">Letter-spacing (em)</label>
                    <input
                      type="number"
                      step={0.01}
                      value={token.letterSpacing ?? 0}
                      min={-0.4}
                      max={0.4}
                      onChange={(event) =>
                        handleTypographyLetterSpacing(tokenKey, Number(event.target.value))
                      }
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Шкала отступов</h3>
          <p className="mt-1 text-sm text-gray-600">
            Значения задаются в пикселях и автоматически конвертируются в rem для CSS-переменных и Tailwind.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            {spacingOrder.map((spacingKey) => (
              <label key={spacingKey} className="flex items-center justify-between gap-4">
                <div>
                  <span className="block text-sm font-medium text-gray-700">
                    {spacingLabels[spacingKey].label}
                  </span>
                  <span className="block text-xs text-gray-500">{spacingLabels[spacingKey].hint}</span>
                </div>
                <input
                  type="number"
                  value={settings.spacing[spacingKey]}
                  min={0}
                  max={400}
                  onChange={(event) => handleSpacingChange(spacingKey, Number(event.target.value))}
                  className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </label>
            ))}
          </div>
          <div className="space-y-3 rounded-md border border-gray-100 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900">Визуальная шкала (rem)</p>
            <div className="space-y-3">
              {spacingOrder.map((spacingKey) => (
                <div key={spacingKey} className="flex items-center gap-3">
                  <span className="w-10 text-xs font-medium text-gray-500">
                    {spacingLabels[spacingKey].label}
                  </span>
                  <div
                    className="h-2 rounded bg-gray-300"
                    style={{ width: `calc(${pxToRem(settings.spacing[spacingKey])} * 12)` }}
                  />
                  <span className="text-xs text-gray-500">{settings.spacing[spacingKey]}px</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Предпросмотр дизайн-системы</h3>
        <p className="mt-1 text-sm text-gray-600">
          Используем актуальные токены, чтобы показать, как они повлияют на интерфейс.
        </p>
        <div style={designSystemStyle} className="mt-6 space-y-6 rounded-md border border-gray-100 bg-gray-50 p-6">
          <div className="space-y-2">
            <h1>Kyanchir Design Tokens</h1>
            <h2>Гибкая система, управляемая из админки</h2>
            <h3>Предпросмотр заголовка третьего уровня</h3>
            <p>
              Это пример абзаца, который использует переменные дизайн-системы. Измените значения слева и сразу увидите
              результат.
            </p>
            <small>Мелкий текст для подписей и вспомогательной информации.</small>
          </div>
          <div className="space-y-4">
            <p className="text-sm font-semibold text-gray-700">Цветовая палитра</p>
            <div className="grid gap-3 md:grid-cols-3">
              {Object.entries(settings.colors).map(([key, value]) => (
                <div key={key} className="flex items-center gap-3 rounded-md border border-gray-200 bg-white p-3">
                  <span className="h-10 w-10 rounded-md border border-gray-100" style={{ backgroundColor: value }} />
                  <div>
                    <p className="text-xs font-semibold text-gray-700">{colorFieldMeta[key as keyof typeof colorFieldMeta].label}</p>
                    <p className="text-xs text-gray-500">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-sm font-semibold text-gray-700">Шкала отступов</p>
            <div className="flex flex-wrap gap-ds-sm rounded-md border border-dashed border-gray-300 p-ds-md">
              {spacingOrder.map((spacingKey) => (
                <div
                  key={spacingKey}
                  className="flex h-10 w-24 items-center justify-center rounded-md bg-white text-xs text-gray-600 shadow-sm"
                >
                  {spacingLabels[spacingKey].label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Каталог иконок</h3>
        <p className="mt-1 text-sm text-gray-600">
          Все SVG, используемые на сайте. Можно скопировать код и при необходимости заменить иконку через админку в будущем.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          {iconEntries.map(([name, Icon]) => (
            <div key={name} className="flex flex-col gap-3 rounded-md border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-900">{name}</p>
                <button
                  type="button"
                  onClick={() => handleCopyIconMarkup(name)}
                  className="text-xs font-semibold text-gray-500 transition hover:text-gray-700"
                >
                  Скопировать SVG
                </button>
              </div>
              <div
                ref={(node) => {
                  if (node) {
                    iconRefs.current[name] = node;
                  } else {
                    delete iconRefs.current[name];
                  }
                }}
                className="flex h-16 items-center justify-center rounded-md border border-dashed border-gray-300 bg-white"
              >
                <Icon className="h-10 w-10 text-gray-800" aria-hidden="true" />
              </div>
              <textarea
                value={iconMarkup[name] ?? ''}
                readOnly
                className="h-28 w-full rounded-md border border-gray-300 px-3 py-2 text-xs font-mono text-gray-600 focus:outline-none"
              />
            </div>
          ))}
        </div>
      </section>
    </form>
  );
}
