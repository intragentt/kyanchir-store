'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { toast } from 'react-hot-toast';
import { LoadingButton } from '@/components/shared/ui';
import { cn } from '@/lib/utils';
import type { DesignSystemSettings } from '@/lib/settings/design-system';

interface DesignSystemFormProps {
  initialSettings: DesignSystemSettings;
  defaultSettings: DesignSystemSettings;
}

const spacingOrder: Array<keyof DesignSystemSettings['spacing']> = [
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
  '3xl',
];

const typographyOrder: Array<keyof DesignSystemSettings['typography']> = [
  'h1',
  'h2',
  'h3',
  'body',
  'small',
];

const typographyLabels: Record<keyof DesignSystemSettings['typography'], string> = {
  h1: 'Заголовок H1',
  h2: 'Заголовок H2',
  h3: 'Заголовок H3',
  body: 'Основной текст',
  small: 'Мелкий текст',
};

const fontLabels: Record<keyof DesignSystemSettings['fonts'], string> = {
  heading: 'Заголовки',
  body: 'Основной текст',
  accent: 'Акцентный / моно',
};

function cloneSettings(settings: DesignSystemSettings) {
  return JSON.parse(JSON.stringify(settings)) as DesignSystemSettings;
}

function humanizeSpacingKey(key: keyof DesignSystemSettings['spacing']) {
  if (key === '2xl') return '2XL';
  if (key === '3xl') return '3XL';
  return key.toUpperCase();
}

export default function DesignSystemForm({
  initialSettings,
  defaultSettings,
}: DesignSystemFormProps) {
  const [settings, setSettings] = useState<DesignSystemSettings>(cloneSettings(initialSettings));
  const [savedSnapshot, setSavedSnapshot] = useState<DesignSystemSettings>(
    cloneSettings(initialSettings),
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSettings(cloneSettings(initialSettings));
    setSavedSnapshot(cloneSettings(initialSettings));
  }, [initialSettings]);

  const isDirty = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(savedSnapshot),
    [settings, savedSnapshot],
  );

  const previewStyle = useMemo(() => {
    return {
      '--ds-font-heading': settings.fonts.heading.stack,
      '--ds-font-body': settings.fonts.body.stack,
      '--ds-font-accent': settings.fonts.accent.stack,
      '--ds-heading-1-size': settings.typography.h1.size,
      '--ds-heading-1-line-height': settings.typography.h1.lineHeight,
      '--ds-heading-1-weight': settings.typography.h1.weight,
      '--ds-heading-1-letter-spacing': settings.typography.h1.letterSpacing ?? 'normal',
      '--ds-heading-2-size': settings.typography.h2.size,
      '--ds-heading-2-line-height': settings.typography.h2.lineHeight,
      '--ds-heading-2-weight': settings.typography.h2.weight,
      '--ds-heading-2-letter-spacing': settings.typography.h2.letterSpacing ?? 'normal',
      '--ds-heading-3-size': settings.typography.h3.size,
      '--ds-heading-3-line-height': settings.typography.h3.lineHeight,
      '--ds-heading-3-weight': settings.typography.h3.weight,
      '--ds-heading-3-letter-spacing': settings.typography.h3.letterSpacing ?? 'normal',
      '--ds-body-font-size': settings.typography.body.size,
      '--ds-body-line-height': settings.typography.body.lineHeight,
      '--ds-body-font-weight': settings.typography.body.weight,
      '--ds-body-letter-spacing': settings.typography.body.letterSpacing ?? 'normal',
      '--ds-small-font-size': settings.typography.small.size,
      '--ds-small-line-height': settings.typography.small.lineHeight,
      '--ds-small-font-weight': settings.typography.small.weight,
      '--ds-small-letter-spacing': settings.typography.small.letterSpacing ?? 'normal',
      '--ds-spacing-xs': settings.spacing.xs,
      '--ds-spacing-sm': settings.spacing.sm,
      '--ds-spacing-md': settings.spacing.md,
      '--ds-spacing-lg': settings.spacing.lg,
      '--ds-spacing-xl': settings.spacing.xl,
      '--ds-spacing-2xl': settings.spacing['2xl'],
      '--ds-spacing-3xl': settings.spacing['3xl'],
    } as CSSProperties;
  }, [settings]);

  const handleSiteNameChange = useCallback((value: string) => {
    setSettings((prev) => ({ ...prev, siteName: value }));
  }, []);

  const handleFontChange = useCallback(
    (fontKey: keyof DesignSystemSettings['fonts'], field: 'stack' | 'source', value: string) => {
      setSettings((prev) => ({
        ...prev,
        fonts: {
          ...prev.fonts,
          [fontKey]: {
            ...prev.fonts[fontKey],
            [field]: value,
          },
        },
      }));
    },
    [],
  );

  const handleTypographyChange = useCallback(
    (
      token: keyof DesignSystemSettings['typography'],
      field: keyof DesignSystemSettings['typography']['h1'],
      value: string,
    ) => {
      setSettings((prev) => ({
        ...prev,
        typography: {
          ...prev.typography,
          [token]: {
            ...prev.typography[token],
            [field]: value,
          },
        },
      }));
    },
    [],
  );

  const handleSpacingChange = useCallback(
    (spacingKey: keyof DesignSystemSettings['spacing'], value: string) => {
      setSettings((prev) => ({
        ...prev,
        spacing: {
          ...prev.spacing,
          [spacingKey]: value,
        },
      }));
    },
    [],
  );

  const handleResetToDefaults = useCallback(() => {
    setSettings(cloneSettings(defaultSettings));
  }, [defaultSettings]);

  const handleRevert = useCallback(() => {
    setSettings(cloneSettings(savedSnapshot));
  }, [savedSnapshot]);

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
        setSavedSnapshot(nextSettings);
        toast.success('Дизайн-система обновлена');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Неизвестная ошибка сохранения';
        toast.error(message);
      } finally {
        setIsSaving(false);
      }
    },
    [settings],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Управление токенами</h2>
          <p className="text-sm text-gray-600">
            Все значения автоматически нормализуются и сохраняются в таблице SystemSetting
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
        <h3 className="text-lg font-semibold text-gray-900">Идентика</h3>
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
            <span className="text-xs text-gray-500">
              Используется в metadata и заголовках публичной части
            </span>
          </label>
        </div>
      </section>

      <section className="grid gap-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Шрифтовые стеки</h3>
          <p className="mt-1 text-sm text-gray-600">
            Укажите CSS-стек шрифтов. Если используете кастомный источник, добавьте ссылку на Google Fonts или
            собственный CSS.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {Object.keys(fontLabels).map((fontKey) => {
            const key = fontKey as keyof DesignSystemSettings['fonts'];
            const font = settings.fonts[key];
            return (
              <div key={key} className="space-y-3 rounded-md border border-gray-100 bg-gray-50 p-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{fontLabels[key]}</p>
                  <p className="text-xs text-gray-500">CSS-стек и опциональный источник</p>
                </div>
                <label className="flex flex-col space-y-1">
                  <span className="text-xs font-medium text-gray-600">Стек шрифтов</span>
                  <textarea
                    value={font.stack}
                    onChange={(event) => handleFontChange(key, 'stack', event.target.value)}
                    className="min-h-[72px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    placeholder='var(--font-heading), "Unbounded", sans-serif'
                  />
                </label>
                <label className="flex flex-col space-y-1">
                  <span className="text-xs font-medium text-gray-600">Источник (опционально)</span>
                  <input
                    type="url"
                    value={font.source ?? ''}
                    onChange={(event) => handleFontChange(key, 'source', event.target.value)}
                    placeholder="https://fonts.googleapis.com/..."
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                </label>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Типографика</h3>
          <p className="mt-1 text-sm text-gray-600">
            Значения используются как CSS-переменные и доступны в tailwind как классы text-ds-*
          </p>
        </div>
        <div className="grid gap-4">
          {typographyOrder.map((tokenKey) => {
            const token = settings.typography[tokenKey];
            return (
              <div
                key={tokenKey}
                className="grid gap-3 rounded-md border border-gray-100 bg-gray-50 p-4 md:grid-cols-4"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{typographyLabels[tokenKey]}</p>
                  <p className="text-xs text-gray-500">font-size, line-height, weight, letter-spacing</p>
                </div>
                <label className="flex flex-col space-y-1">
                  <span className="text-xs font-medium text-gray-600">Размер</span>
                  <input
                    type="text"
                    value={token.size}
                    onChange={(event) =>
                      handleTypographyChange(tokenKey, 'size', event.target.value)
                    }
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                </label>
                <label className="flex flex-col space-y-1">
                  <span className="text-xs font-medium text-gray-600">Line-height</span>
                  <input
                    type="text"
                    value={token.lineHeight}
                    onChange={(event) =>
                      handleTypographyChange(tokenKey, 'lineHeight', event.target.value)
                    }
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="flex flex-col space-y-1">
                    <span className="text-xs font-medium text-gray-600">Вес</span>
                    <input
                      type="text"
                      value={token.weight}
                      onChange={(event) =>
                        handleTypographyChange(tokenKey, 'weight', event.target.value)
                      }
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  </label>
                  <label className="flex flex-col space-y-1">
                    <span className="text-xs font-medium text-gray-600">Letter-spacing</span>
                    <input
                      type="text"
                      value={token.letterSpacing ?? ''}
                      onChange={(event) =>
                        handleTypographyChange(tokenKey, 'letterSpacing', event.target.value)
                      }
                      placeholder="например, -0.02em"
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  </label>
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
            Значения используются как CSS-переменные и доступны в tailwind как spacing ds-*
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            {spacingOrder.map((spacingKey) => (
              <label key={spacingKey} className="flex items-center justify-between gap-4">
                <div>
                  <span className="block text-sm font-medium text-gray-700">
                    {humanizeSpacingKey(spacingKey)}
                  </span>
                  <span className="block text-xs text-gray-500">Класс: gap-ds-{spacingKey}</span>
                </div>
                <input
                  type="text"
                  value={settings.spacing[spacingKey]}
                  onChange={(event) => handleSpacingChange(spacingKey, event.target.value)}
                  className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                />
              </label>
            ))}
          </div>
          <div className="space-y-3 rounded-md border border-gray-100 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900">Превью шкалы</p>
            <div className="space-y-3">
              {spacingOrder.map((spacingKey) => (
                <div key={spacingKey} className="flex items-center gap-3">
                  <span className="w-10 text-xs font-medium text-gray-500">
                    {humanizeSpacingKey(spacingKey)}
                  </span>
                  <div className="h-2 rounded bg-gray-300" style={{ width: `calc(${settings.spacing[spacingKey]} * 6)` }} />
                  <span className="text-xs text-gray-500">{settings.spacing[spacingKey]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Превью дизайн-системы</h3>
        <p className="mt-1 text-sm text-gray-600">
          Секция показывает, как текущие токены повлияют на типографику и отступы.
        </p>
        <div style={previewStyle} className="mt-6 space-y-6 rounded-md border border-gray-100 bg-gray-50 p-6">
          <div className="space-y-2">
            <h1>Kyanchir Design Tokens</h1>
            <h2>Гибкая система, управляемая из админки</h2>
            <h3>Предпросмотр заголовка третьего уровня</h3>
            <p>
              Это пример абзаца, который использует переменные дизайн-системы. Все значения для размера, line-height и
              межбуквенного интервала берутся из токенов, которые вы сохраняете.
            </p>
            <small>Мелкий текст, например для вспомогательных подписей и тултипов.</small>
          </div>
          <div className="space-y-4">
            <p className="text-sm font-semibold text-gray-700">Шкала отступов</p>
            <div className="flex flex-wrap gap-ds-sm rounded-md border border-dashed border-gray-300 p-ds-md">
              {spacingOrder.map((spacingKey) => (
                <div
                  key={spacingKey}
                  className="flex h-10 w-24 items-center justify-center rounded-md bg-white text-xs text-gray-600 shadow-sm"
                >
                  {spacingKey}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </form>
  );
}
