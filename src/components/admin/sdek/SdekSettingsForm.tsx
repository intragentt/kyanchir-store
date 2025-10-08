'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { toast } from 'react-hot-toast';
import { LoadingButton } from '@/components/shared/ui';
import type { SdekSettingsView } from '@/lib/settings/sdek';

interface ModeState {
  account: string;
  hasSecurePassword: boolean;
  securePassword: string;
  secretTouched: boolean;
}

interface FormState {
  mode: 'test' | 'production';
  defaultSenderName: string;
  defaultSenderPhone: string;
  defaultSenderCityCode: string;
  defaultSenderAddress: string;
  defaultTariffCode: string;
  defaultPackageWeightGrams: string;
  webhookSecret: string;
  test: ModeState;
  production: ModeState;
}

interface SdekSettingsFormProps {
  initialSettings: SdekSettingsView;
  initialUpdatedAt: string | null;
}

const toStringNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
};

const createModeState = (summary: SdekSettingsView['test']): ModeState => ({
  account: summary.account ?? '',
  hasSecurePassword: summary.hasSecurePassword,
  securePassword: '',
  secretTouched: false,
});

const createFormState = (settings: SdekSettingsView): FormState => ({
  mode: settings.mode,
  defaultSenderName: settings.defaultSenderName ?? '',
  defaultSenderPhone: settings.defaultSenderPhone ?? '',
  defaultSenderCityCode: toStringNumber(settings.defaultSenderCityCode),
  defaultSenderAddress: settings.defaultSenderAddress ?? '',
  defaultTariffCode: toStringNumber(settings.defaultTariffCode),
  defaultPackageWeightGrams: toStringNumber(settings.defaultPackageWeightGrams),
  webhookSecret: settings.webhookSecret ?? '',
  test: createModeState(settings.test),
  production: createModeState(settings.production),
});

const cloneView = (settings: SdekSettingsView): SdekSettingsView =>
  JSON.parse(JSON.stringify(settings)) as SdekSettingsView;

const parseNumberField = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const buildComparableSnapshot = (state: FormState): SdekSettingsView => ({
  mode: state.mode,
  test: {
    account: state.test.account.trim() || null,
    hasSecurePassword: state.test.secretTouched
      ? Boolean(state.test.securePassword)
      : state.test.hasSecurePassword,
  },
  production: {
    account: state.production.account.trim() || null,
    hasSecurePassword: state.production.secretTouched
      ? Boolean(state.production.securePassword)
      : state.production.hasSecurePassword,
  },
  defaultSenderName: state.defaultSenderName.trim() || null,
  defaultSenderPhone: state.defaultSenderPhone.trim() || null,
  defaultSenderCityCode: parseNumberField(state.defaultSenderCityCode),
  defaultSenderAddress: state.defaultSenderAddress.trim() || null,
  defaultTariffCode: parseNumberField(state.defaultTariffCode),
  defaultPackageWeightGrams: parseNumberField(state.defaultPackageWeightGrams),
  webhookSecret: state.webhookSecret.trim() || null,
});

const formatUpdatedAt = (iso: string | null): string => {
  if (!iso) {
    return 'ещё не сохранялось';
  }

  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat('ru-RU', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch (error) {
    console.warn('[SdekSettingsForm] Не удалось отформатировать дату обновления', error);
    return '—';
  }
};

const generateSecret = (): string => {
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  return Math.random().toString(36).slice(2, 18) + Math.random().toString(36).slice(2, 18);
};

export default function SdekSettingsForm({ initialSettings, initialUpdatedAt }: SdekSettingsFormProps) {
  const [formState, setFormState] = useState<FormState>(() => createFormState(initialSettings));
  const [baseline, setBaseline] = useState<SdekSettingsView>(() => cloneView(initialSettings));
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(initialUpdatedAt);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormState(createFormState(initialSettings));
    setBaseline(cloneView(initialSettings));
    setLastSavedAt(initialUpdatedAt);
  }, [initialSettings, initialUpdatedAt]);

  const isDirty = useMemo(() => {
    return JSON.stringify(buildComparableSnapshot(formState)) !== JSON.stringify(baseline);
  }, [formState, baseline]);

  const handleModeChange = useCallback((mode: 'test' | 'production') => {
    setFormState((prev) => ({
      ...prev,
      mode,
    }));
  }, []);

  const handleFieldChange = useCallback((key: keyof Omit<FormState, 'test' | 'production'>, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const handleCredentialsChange = useCallback(
    (mode: 'test' | 'production', key: 'account' | 'securePassword', value: string) => {
      setFormState((prev) => ({
        ...prev,
        [mode]: {
          ...prev[mode],
          [key]: value,
          ...(key === 'securePassword'
            ? { secretTouched: true, hasSecurePassword: Boolean(value) }
            : {}),
        },
      }));
    },
    [],
  );

  const handleSecretReset = useCallback((mode: 'test' | 'production') => {
    setFormState((prev) => ({
      ...prev,
      [mode]: {
        ...prev[mode],
        securePassword: '',
        secretTouched: true,
        hasSecurePassword: false,
      },
    }));
  }, []);

  const handleGenerateWebhookSecret = useCallback(() => {
    setFormState((prev) => ({
      ...prev,
      webhookSecret: generateSecret(),
    }));
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!isDirty) {
        toast.error('Нет изменений для сохранения');
        return;
      }

      setIsSaving(true);
      const toastId = toast.loading('Сохраняем настройки СДЭК…');

      try {
        const payload = {
          mode: formState.mode,
          defaultSenderName: formState.defaultSenderName.trim(),
          defaultSenderPhone: formState.defaultSenderPhone.trim(),
          defaultSenderCityCode: formState.defaultSenderCityCode.trim(),
          defaultSenderAddress: formState.defaultSenderAddress.trim(),
          defaultTariffCode: formState.defaultTariffCode.trim(),
          defaultPackageWeightGrams: formState.defaultPackageWeightGrams.trim(),
          webhookSecret: formState.webhookSecret.trim(),
          test: {
            account: formState.test.account.trim(),
            ...(formState.test.secretTouched ? { securePassword: formState.test.securePassword } : {}),
          },
          production: {
            account: formState.production.account.trim(),
            ...(formState.production.secretTouched
              ? { securePassword: formState.production.securePassword }
              : {}),
          },
        };

        const response = await fetch('/api/admin/settings/sdek', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || 'Не удалось сохранить настройки СДЭК');
        }

        const nextSettings = data?.data as SdekSettingsView;
        const nextUpdatedAt = data?.updatedAt as string | null;

        setFormState(createFormState(nextSettings));
        setBaseline(cloneView(nextSettings));
        setLastSavedAt(nextUpdatedAt);

        toast.success(data?.message ?? 'Настройки СДЭК сохранены', { id: toastId });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Не удалось сохранить настройки СДЭК',
          { id: toastId },
        );
      } finally {
        setIsSaving(false);
      }
    },
    [formState, isDirty],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">🚚 Интеграция с СДЭК</h2>
            <p className="max-w-3xl text-sm text-gray-600">
              Укажите аккаунты и секреты для тестовой и боевой сред, а также параметры отправителя и тариф по умолчанию.
              Данные сохраняются в System Settings и будут использоваться сервисами доставки и расчёта стоимости.
            </p>
            <p className="text-xs text-gray-500">Последнее обновление: {formatUpdatedAt(lastSavedAt)}</p>
          </div>
          <div className="flex flex-col gap-2 rounded-md border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
            <strong className="text-sm font-semibold">Памятка</strong>
            <span>• Тестовые учётные данные: https://api-docs.cdek.ru/29923859.html</span>
            <span>• Боевые учётные данные выдаются менеджером интеграции СДЭК</span>
            <span>• После сохранения обновите вебхуки на стороне СДЭК новым секретом</span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Режим работы</h3>
        <p className="mt-1 text-sm text-gray-600">
          В тестовом режиме запросы отправляются на песочницу, в боевом — на production API. Сменить режим можно в
          любой момент.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {(
            [
              { value: 'test', label: 'Тестовый' },
              { value: 'production', label: 'Боевой' },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleModeChange(option.value)}
              className={`rounded-md border px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                formState.mode === option.value
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-white'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {(
          [
            { key: 'test', title: 'Тестовая среда' },
            { key: 'production', title: 'Боевая среда' },
          ] as const
        ).map((mode) => {
          const state = formState[mode.key];
          return (
            <div key={mode.key} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">{mode.title}</h3>
              <p className="mt-1 text-sm text-gray-600">
                Укажите логин (account) и секрет (secure_password) от личного кабинета СДЭК.
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700" htmlFor={`${mode.key}-account`}>
                    Account
                  </label>
                  <input
                    id={`${mode.key}-account`}
                    value={state.account}
                    onChange={(event) => handleCredentialsChange(mode.key, 'account', event.target.value)}
                    placeholder="Например, 12345"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700" htmlFor={`${mode.key}-secret`}>
                      Secure password
                    </label>
                    {state.hasSecurePassword && !state.secretTouched ? (
                      <button
                        type="button"
                        onClick={() => handleSecretReset(mode.key)}
                        className="text-xs font-medium text-red-600 hover:text-red-500"
                      >
                        Очистить сохранённый секрет
                      </button>
                    ) : null}
                  </div>
                  <input
                    id={`${mode.key}-secret`}
                    type="password"
                    value={state.secretTouched ? state.securePassword : ''}
                    onChange={(event) => handleCredentialsChange(mode.key, 'securePassword', event.target.value)}
                    placeholder={state.hasSecurePassword && !state.secretTouched ? 'Секрет скрыт — введите новый' : 'Введите секрет...'}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                  {state.hasSecurePassword && !state.secretTouched ? (
                    <p className="mt-1 text-xs text-gray-500">Секрет сохранён. Введите новое значение, чтобы заменить его.</p>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Параметры отправителя по умолчанию</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="sender-name">
              Наименование отправителя
            </label>
            <input
              id="sender-name"
              value={formState.defaultSenderName}
              onChange={(event) => handleFieldChange('defaultSenderName', event.target.value)}
              placeholder="ИП Иванов Иван Иванович"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="sender-phone">
              Телефон отправителя
            </label>
            <input
              id="sender-phone"
              value={formState.defaultSenderPhone}
              onChange={(event) => handleFieldChange('defaultSenderPhone', event.target.value)}
              placeholder="+7 (999) 123-45-67"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="sender-city">
              Код города отправителя (CityCode)
            </label>
            <input
              id="sender-city"
              value={formState.defaultSenderCityCode}
              onChange={(event) => handleFieldChange('defaultSenderCityCode', event.target.value)}
              placeholder="Например, 270"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="sender-address">
              Адрес склада отправителя
            </label>
            <input
              id="sender-address"
              value={formState.defaultSenderAddress}
              onChange={(event) => handleFieldChange('defaultSenderAddress', event.target.value)}
              placeholder="г. Москва, ул. Примерная, д. 1"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="tariff-code">
              Тариф по умолчанию (TariffCode)
            </label>
            <input
              id="tariff-code"
              value={formState.defaultTariffCode}
              onChange={(event) => handleFieldChange('defaultTariffCode', event.target.value)}
              placeholder="Например, 136"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="package-weight">
              Вес посылки по умолчанию (граммы)
            </label>
            <input
              id="package-weight"
              value={formState.defaultPackageWeightGrams}
              onChange={(event) => handleFieldChange('defaultPackageWeightGrams', event.target.value)}
              placeholder="Например, 500"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="webhook-secret">
            Webhook secret
          </label>
          <div className="mt-1 flex flex-col gap-3 sm:flex-row">
            <input
              id="webhook-secret"
              value={formState.webhookSecret}
              onChange={(event) => handleFieldChange('webhookSecret', event.target.value)}
              placeholder="Используется для подписи уведомлений от СДЭК"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <button
              type="button"
              onClick={handleGenerateWebhookSecret}
              className="inline-flex items-center justify-center rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
            >
              Сгенерировать
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <p className="text-xs text-gray-500">
          После сохранения сервисы доставки автоматически перейдут на выбранный режим и реквизиты.
        </p>
        <LoadingButton type="submit" isLoading={isSaving} disabled={!isDirty || isSaving}>
          Сохранить настройки
        </LoadingButton>
      </div>
    </form>
  );
}
