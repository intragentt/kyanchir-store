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
  return {
    testModeEnabled: state.testModeEnabled,
    testModeMessage: state.testModeMessage.trim(),
    hideTestBannerForAdmins: state.hideTestBannerForAdmins,
    maintenanceModeEnabled: state.maintenanceModeEnabled,
    maintenanceMessage: state.maintenanceMessage.trim(),
    maintenanceEndsAt: state.maintenanceEndsAt ? new Date(state.maintenanceEndsAt).toISOString() : null,
    hideMaintenanceForAdmins: state.hideMaintenanceForAdmins,
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
          hideTestBannerForAdmins: data.data.hideTestBannerForAdmins,
          maintenanceModeEnabled: data.data.maintenanceModeEnabled,
          maintenanceMessage: data.data.maintenanceMessage,
          maintenanceEndsAt: data.data.maintenanceEndsAt,
          hideMaintenanceForAdmins: data.data.hideMaintenanceForAdmins,
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
