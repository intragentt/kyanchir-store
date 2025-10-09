'use client';

import { useCallback, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { LoadingButton } from '@/components/shared/ui/LoadingButton';
import type { SiteModeClientSettings } from '@/components/providers/SiteModeProvider';

interface SiteModeSettingsFormProps {
  initialSettings: SiteModeClientSettings;
}

type FormState = SiteModeClientSettings;

function toDateTimeLocal(value: string | null): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return '';
  }

  const offset = date.getTimezoneOffset();
  const corrected = new Date(date.getTime() - offset * 60_000);
  return corrected.toISOString().slice(0, 16);
}

function normalizePayload(state: FormState) {
  const marqueeSpeed = Number(state.testModeMarqueeSpeed);
  const backdropOpacity = Number(state.maintenanceBackdropOpacity);
  const rawBackdropColor = state.maintenanceBackdropColor.trim();
  const rawTextColor = state.maintenanceTextColor.trim();
  const backdropColor = rawBackdropColor
    ? rawBackdropColor.startsWith('#')
      ? rawBackdropColor
      : `#${rawBackdropColor}`
    : '#020617';
  const textColor = rawTextColor
    ? rawTextColor.startsWith('#')
      ? rawTextColor
      : `#${rawTextColor}`
    : '#f8fafc';

  return {
    testModeEnabled: state.testModeEnabled,
    testModeMessage: state.testModeMessage.trim(),
    testModeMarqueeSpeed: Number.isFinite(marqueeSpeed) ? marqueeSpeed : 18,
    hideTestBannerForAdmins: state.hideTestBannerForAdmins,
    maintenanceModeEnabled: state.maintenanceModeEnabled,
    maintenanceMessage: state.maintenanceMessage.trim(),
    maintenanceEndsAt: state.maintenanceEndsAt ? new Date(state.maintenanceEndsAt).toISOString() : null,
    hideMaintenanceForAdmins: state.hideMaintenanceForAdmins,
    maintenanceCtaEnabled: state.maintenanceCtaEnabled,
    maintenanceCtaLabel: state.maintenanceCtaLabel.trim(),
    maintenanceCtaHref: state.maintenanceCtaHref.trim(),
    maintenanceBackdropColor: backdropColor,
    maintenanceBackdropOpacity: Number.isFinite(backdropOpacity) ? backdropOpacity : 80,
    maintenanceTextColor: textColor,
  };
}

export default function SiteModeSettingsForm({ initialSettings }: SiteModeSettingsFormProps) {
  const [formState, setFormState] = useState<FormState>(initialSettings);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maintenanceDeadlineLocal = useMemo(
    () => toDateTimeLocal(formState.maintenanceEndsAt),
    [formState.maintenanceEndsAt],
  );

  const handleFieldChange = useCallback(<Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const submitSettings = useCallback(
    async (override?: Partial<FormState>) => {
      setIsSubmitting(true);
      const payload = normalizePayload({ ...formState, ...override });

      try {
        const response = await fetch('/api/admin/settings/site-mode', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || 'Не удалось сохранить настройки');
        }

        const nextState: FormState = {
          testModeEnabled: data.data.testModeEnabled,
          testModeMessage: data.data.testModeMessage,
          testModeMarqueeSpeed: data.data.testModeMarqueeSpeed,
          hideTestBannerForAdmins: data.data.hideTestBannerForAdmins,
          maintenanceModeEnabled: data.data.maintenanceModeEnabled,
          maintenanceMessage: data.data.maintenanceMessage,
          maintenanceEndsAt: data.data.maintenanceEndsAt,
          hideMaintenanceForAdmins: data.data.hideMaintenanceForAdmins,
          maintenanceCtaEnabled: data.data.maintenanceCtaEnabled,
          maintenanceCtaLabel: data.data.maintenanceCtaLabel,
          maintenanceCtaHref: data.data.maintenanceCtaHref,
          maintenanceBackdropColor: data.data.maintenanceBackdropColor,
          maintenanceBackdropOpacity: data.data.maintenanceBackdropOpacity,
          maintenanceTextColor: data.data.maintenanceTextColor,
        };

        setFormState(nextState);
        toast.success(data?.message || 'Настройки сохранены');
      } catch (error) {
        console.error('[SiteModeSettingsForm] Ошибка сохранения', error);
        toast.error(error instanceof Error ? error.message : 'Неизвестная ошибка');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      await submitSettings();
    },
    [submitSettings],
  );

  const handleMaintenanceEndsAtChange = useCallback(
    (value: string) => {
      if (!value) {
        handleFieldChange('maintenanceEndsAt', null);
        return;
      }

      const parsed = new Date(value);
      if (Number.isFinite(parsed.getTime())) {
        handleFieldChange('maintenanceEndsAt', parsed.toISOString());
      }
    },
    [handleFieldChange],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">🧪 Тестовый режим</h2>
            <p className="text-sm text-gray-600">
              Включите бегущую строку на всех публичных страницах, чтобы предупредить пользователей о тестовом окружении.
            </p>
          </div>
          <div className="flex gap-2">
            <LoadingButton
              type="button"
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              isLoading={isSubmitting}
              onClick={() => submitSettings({ testModeEnabled: true })}
            >
              Включить бегущую строку
            </LoadingButton>
            <LoadingButton
              type="button"
              className="rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300"
              isLoading={isSubmitting}
              onClick={() => submitSettings({ testModeEnabled: false })}
            >
              Выключить
            </LoadingButton>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Текст бегущей строки
            <textarea
              value={formState.testModeMessage}
              onChange={(event) => handleFieldChange('testModeMessage', event.target.value)}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
              rows={2}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <label className="block text-sm font-medium text-gray-700">
              Скорость движения
              <input
                type="range"
                min={4}
                max={60}
                step={1}
                value={formState.testModeMarqueeSpeed}
                onChange={(event) => handleFieldChange('testModeMarqueeSpeed', Number(event.target.value))}
                className="mt-2 w-full"
              />
            </label>
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{formState.testModeMarqueeSpeed}&nbsp;сек</span>
              <p className="text-xs text-gray-500">Длительность полного цикла (меньше = быстрее)</p>
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={formState.hideTestBannerForAdmins}
              onChange={(event) => handleFieldChange('hideTestBannerForAdmins', event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            Не показывать уведомление администраторам
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">🚧 Технические работы</h2>
            <p className="text-sm text-gray-600">
              Покажите заглушку «Идут технические работы» и настройте обратный отсчёт до завершения.
            </p>
          </div>
          <div className="flex gap-2">
            <LoadingButton
              type="button"
              className="rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-500"
              isLoading={isSubmitting}
              onClick={() =>
                submitSettings({
                  maintenanceModeEnabled: true,
                  maintenanceMessage: formState.maintenanceMessage,
                  maintenanceEndsAt: formState.maintenanceEndsAt,
                })
              }
            >
              Запустить техработы
            </LoadingButton>
            <LoadingButton
              type="button"
              className="rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300"
              isLoading={isSubmitting}
              onClick={() =>
                submitSettings({
                  maintenanceModeEnabled: false,
                })
              }
            >
              Завершить
            </LoadingButton>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Сообщение для пользователей
            <textarea
              value={formState.maintenanceMessage}
              onChange={(event) => handleFieldChange('maintenanceMessage', event.target.value)}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
              rows={3}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-gray-700">
              Время завершения техработ
              <input
                type="datetime-local"
                value={maintenanceDeadlineLocal}
                onChange={(event) => handleMaintenanceEndsAtChange(event.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
              />
            </label>

            <label className="flex items-center gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formState.hideMaintenanceForAdmins}
                onChange={(event) => handleFieldChange('hideMaintenanceForAdmins', event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              Пропускать заглушку для администраторов
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-gray-700">
              Цвет фона заглушки
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="color"
                  value={formState.maintenanceBackdropColor || '#020617'}
                  onChange={(event) => handleFieldChange('maintenanceBackdropColor', event.target.value)}
                  className="h-10 w-16 cursor-pointer rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={formState.maintenanceBackdropColor}
                  onChange={(event) => handleFieldChange('maintenanceBackdropColor', event.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
                  placeholder="#020617"
                />
              </div>
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Цвет текста заглушки
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="color"
                  value={formState.maintenanceTextColor || '#f8fafc'}
                  onChange={(event) => handleFieldChange('maintenanceTextColor', event.target.value)}
                  className="h-10 w-16 cursor-pointer rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={formState.maintenanceTextColor}
                  onChange={(event) => handleFieldChange('maintenanceTextColor', event.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
                  placeholder="#f8fafc"
                />
              </div>
            </label>

            <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
              Прозрачность фона
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={formState.maintenanceBackdropOpacity}
                  onChange={(event) => handleFieldChange('maintenanceBackdropOpacity', Number(event.target.value))}
                  className="flex-1"
                />
                <span className="w-12 text-right text-sm font-semibold text-gray-900">
                  {formState.maintenanceBackdropOpacity}%
                </span>
              </div>
            </label>
          </div>

          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={formState.maintenanceCtaEnabled}
                onChange={(event) => handleFieldChange('maintenanceCtaEnabled', event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              Показать кнопку поддержки
            </label>

            <p className="text-xs text-gray-500">
              Кнопка появляется внизу заглушки и открывается в новой вкладке. Укажите текст и ссылку, например на Telegram.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700">
                Подпись на кнопке
                <input
                  type="text"
                  value={formState.maintenanceCtaLabel}
                  onChange={(event) => handleFieldChange('maintenanceCtaLabel', event.target.value)}
                  disabled={!formState.maintenanceCtaEnabled}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none disabled:bg-gray-100"
                  placeholder="Написать в Telegram"
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Ссылка
                <input
                  type="url"
                  value={formState.maintenanceCtaHref}
                  onChange={(event) => handleFieldChange('maintenanceCtaHref', event.target.value)}
                  disabled={!formState.maintenanceCtaEnabled}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none disabled:bg-gray-100"
                  placeholder="https://t.me/username"
                />
              </label>
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <LoadingButton
          type="submit"
          isLoading={isSubmitting}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Сохранить изменения
        </LoadingButton>
      </div>
    </form>
  );
}
