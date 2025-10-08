'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { LoadingButton } from '@/components/shared/ui';
import type { YookassaSettingsView } from '@/lib/settings/yookassa';

interface ModeState {
  shopId: string;
  hasSecretKey: boolean;
  secretKey: string;
  secretTouched: boolean;
}

interface FormState {
  mode: 'test' | 'live';
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
  test: ModeState;
  live: ModeState;
}

interface YookassaSettingsFormProps {
  initialSettings: YookassaSettingsView;
  initialUpdatedAt: string | null;
}

const taxSystemOptions = [
  { value: '', label: 'Не указывать (использовать настройки магазина)' },
  { value: '0', label: '0 — Общая система налогообложения (ОСН)' },
  { value: '1', label: '1 — УСН (доходы)' },
  { value: '2', label: '2 — УСН (доходы минус расходы)' },
  { value: '3', label: '3 — ЕНВД (устаревшая, не использовать)' },
  { value: '4', label: '4 — ЕСХН' },
  { value: '5', label: '5 — Патент' },
  { value: '6', label: '6 — НПД' },
];

const vatOptions = [
  { value: '', label: 'Не указывать (1 — 20%)' },
  { value: '1', label: '1 — 20%' },
  { value: '2', label: '2 — 10%' },
  { value: '3', label: '3 — 0%' },
  { value: '4', label: '4 — Без НДС' },
  { value: '5', label: '5 — 10/110' },
  { value: '6', label: '6 — 20/120' },
];

const createModeState = (summary: YookassaSettingsView['test']): ModeState => ({
  shopId: summary.shopId ?? '',
  hasSecretKey: Boolean(summary.hasSecretKey),
  secretKey: '',
  secretTouched: false,
});

const createFormState = (settings: YookassaSettingsView): FormState => ({
  mode: settings.mode,
  merchantInn: settings.merchantInn ?? '',
  merchantFullName: settings.merchantFullName ?? '',
  merchantShortName: settings.merchantShortName ?? '',
  merchantOgrnip: settings.merchantOgrnip ?? '',
  merchantAddress: settings.merchantAddress ?? '',
  merchantBankName: settings.merchantBankName ?? '',
  merchantBankAccount: settings.merchantBankAccount ?? '',
  merchantCorrAccount: settings.merchantCorrAccount ?? '',
  merchantBic: settings.merchantBic ?? '',
  contactEmail: settings.contactEmail ?? '',
  contactPhone: settings.contactPhone ?? '',
  receiptEnabled: settings.receiptEnabled,
  taxSystemCode: settings.taxSystemCode ?? null,
  vatCode: settings.vatCode ?? null,
  returnUrl: settings.returnUrl ?? '',
  test: createModeState(settings.test),
  live: createModeState(settings.live),
});

const cloneView = (settings: YookassaSettingsView): YookassaSettingsView =>
  JSON.parse(JSON.stringify(settings)) as YookassaSettingsView;

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
    console.warn('[YooKassaForm] Не удалось форматировать дату обновления', error);
    return '—';
  }
};

const buildComparableSnapshot = (state: FormState): YookassaSettingsView => ({
  mode: state.mode,
  merchantInn: state.merchantInn,
  merchantFullName: state.merchantFullName,
  merchantShortName: state.merchantShortName,
  merchantOgrnip: state.merchantOgrnip,
  merchantAddress: state.merchantAddress,
  merchantBankName: state.merchantBankName,
  merchantBankAccount: state.merchantBankAccount,
  merchantCorrAccount: state.merchantCorrAccount,
  merchantBic: state.merchantBic,
  contactEmail: state.contactEmail,
  contactPhone: state.contactPhone,
  receiptEnabled: state.receiptEnabled,
  taxSystemCode: state.taxSystemCode,
  vatCode: state.vatCode,
  returnUrl: state.returnUrl,
  test: {
    shopId: state.test.shopId,
    hasSecretKey: state.test.hasSecretKey,
  },
  live: {
    shopId: state.live.shopId,
    hasSecretKey: state.live.hasSecretKey,
  },
});

export default function YookassaSettingsForm({
  initialSettings,
  initialUpdatedAt,
}: YookassaSettingsFormProps) {
  const [formState, setFormState] = useState<FormState>(() => createFormState(initialSettings));
  const [baseline, setBaseline] = useState<YookassaSettingsView>(() => cloneView(initialSettings));
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

  const handleFieldChange = useCallback(
    (key: keyof Omit<FormState, 'test' | 'live'>, value: string) => {
      setFormState((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [],
  );

  const handleModeChange = useCallback((mode: 'test' | 'live') => {
    setFormState((prev) => ({
      ...prev,
      mode,
    }));
  }, []);

  const handleReceiptToggle = useCallback(() => {
    setFormState((prev) => ({
      ...prev,
      receiptEnabled: !prev.receiptEnabled,
    }));
  }, []);

  const handleTaxChange = useCallback((value: string) => {
    setFormState((prev) => ({
      ...prev,
      taxSystemCode: value === '' ? null : Number.parseInt(value, 10),
    }));
  }, []);

  const handleVatChange = useCallback((value: string) => {
    setFormState((prev) => ({
      ...prev,
      vatCode: value === '' ? null : Number.parseInt(value, 10),
    }));
  }, []);

  const handleShopIdChange = useCallback((mode: 'test' | 'live', value: string) => {
    setFormState((prev) => ({
      ...prev,
      [mode]: {
        ...prev[mode],
        shopId: value,
      },
    }));
  }, []);

  const handleSecretChange = useCallback((mode: 'test' | 'live', value: string) => {
    setFormState((prev) => ({
      ...prev,
      [mode]: {
        ...prev[mode],
        secretTouched: true,
        secretKey: value,
        hasSecretKey: value.trim().length > 0,
      },
    }));
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (isSaving) {
        return;
      }

      setIsSaving(true);

      try {
        const payload = {
          mode: formState.mode,
          merchantInn: formState.merchantInn.trim(),
          merchantFullName: formState.merchantFullName.trim(),
          merchantShortName: formState.merchantShortName.trim(),
          merchantOgrnip: formState.merchantOgrnip.trim(),
          merchantAddress: formState.merchantAddress.trim(),
          merchantBankName: formState.merchantBankName.trim(),
          merchantBankAccount: formState.merchantBankAccount.trim(),
          merchantCorrAccount: formState.merchantCorrAccount.trim(),
          merchantBic: formState.merchantBic.trim(),
          contactEmail: formState.contactEmail.trim(),
          contactPhone: formState.contactPhone.trim(),
          receiptEnabled: formState.receiptEnabled,
          taxSystemCode: formState.taxSystemCode,
          vatCode: formState.vatCode,
          returnUrl: formState.returnUrl.trim(),
          test: {
            shopId: formState.test.shopId.trim(),
            secretKey: formState.test.secretTouched ? formState.test.secretKey.trim() : undefined,
          },
          live: {
            shopId: formState.live.shopId.trim(),
            secretKey: formState.live.secretTouched ? formState.live.secretKey.trim() : undefined,
          },
        } as const;

        const response = await fetch('/api/admin/settings/yookassa', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          const details = Array.isArray(data?.details)
            ? data.details.map((issue: { message?: string }) => issue.message).filter(Boolean)
            : [];

          const errorMessage =
            data?.error || details.join('\n') || 'Не удалось сохранить настройки YooKassa';

          toast.error(errorMessage);
          return;
        }

        const nextSettings = data?.data as YookassaSettingsView;
        const updatedAt = (data?.updatedAt as string | null | undefined) ?? null;

        setFormState(createFormState(nextSettings));
        setBaseline(cloneView(nextSettings));
        setLastSavedAt(updatedAt);

        toast.success('Настройки YooKassa сохранены');
      } catch (error) {
        console.error('[YooKassaForm] Не удалось сохранить настройки', error);
        toast.error('Не удалось сохранить настройки YooKassa');
      } finally {
        setIsSaving(false);
      }
    },
    [formState, isSaving],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Режим и API-ключи</h2>
              <p className="mt-1 text-sm text-gray-600">
                Введите Shop ID и секретные ключи для тестового и боевого режимов. Ключи не отображаются в явном виде —
                введите новый, чтобы заменить сохранённое значение.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Текущий режим</span>
              <div className="inline-flex rounded-full border border-gray-200 bg-gray-100 p-1 text-sm font-medium">
                <button
                  type="button"
                  onClick={() => handleModeChange('test')}
                  className={`rounded-full px-3 py-1 transition ${
                    formState.mode === 'test'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Тестовый
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('live')}
                  className={`rounded-full px-3 py-1 transition ${
                    formState.mode === 'live'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Боевой
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Тестовый стенд</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="test-shop-id">
                Shop ID (test)
              </label>
              <input
                id="test-shop-id"
                type="text"
                autoComplete="off"
                value={formState.test.shopId}
                onChange={(event) => handleShopIdChange('test', event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                placeholder="Например, 1174757"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="test-secret">
                Секретный ключ (test)
              </label>
              <input
                id="test-secret"
                type="password"
                autoComplete="new-password"
                value={formState.test.secretKey}
                onChange={(event) => handleSecretChange('test', event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                placeholder={formState.test.hasSecretKey ? 'Ключ скрыт — введите новый для замены' : 'Введите секретный ключ'}
              />
              <p className="mt-1 text-xs text-gray-500">
                Оставьте поле пустым, чтобы сохранить текущий ключ без изменений.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Боевой стенд</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="live-shop-id">
                Shop ID (live)
              </label>
              <input
                id="live-shop-id"
                type="text"
                autoComplete="off"
                value={formState.live.shopId}
                onChange={(event) => handleShopIdChange('live', event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                placeholder="Заполните после активации боевого магазина"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700" htmlFor="live-secret">
                Секретный ключ (live)
              </label>
              <input
                id="live-secret"
                type="password"
                autoComplete="new-password"
                value={formState.live.secretKey}
                onChange={(event) => handleSecretChange('live', event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                placeholder={formState.live.hasSecretKey ? 'Ключ скрыт — введите новый для замены' : 'Введите секретный ключ'}
              />
              <p className="mt-1 text-xs text-gray-500">
                Поле можно оставить пустым, чтобы не перезаписывать сохранённое значение.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Данные индивидуального предпринимателя</h2>
          <p className="mt-1 text-sm text-gray-600">
            Эти сведения передаются в YooKassa и попадают в чек: ФИО, ИНН, ОГРНИП и юридический адрес продавца.
          </p>
        </div>
        <div className="grid gap-6 p-6 lg:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="merchant-inn">
              ИНН
            </label>
            <input
              id="merchant-inn"
              type="text"
              inputMode="numeric"
              value={formState.merchantInn}
              onChange={(event) => handleFieldChange('merchantInn', event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="10 или 12 цифр"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="merchant-ogrnip">
              ОГРНИП
            </label>
            <input
              id="merchant-ogrnip"
              type="text"
              value={formState.merchantOgrnip}
              onChange={(event) => handleFieldChange('merchantOgrnip', event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="15 цифр"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700" htmlFor="merchant-full-name">
              ФИО / Полное наименование
            </label>
            <input
              id="merchant-full-name"
              type="text"
              value={formState.merchantFullName}
              onChange={(event) => handleFieldChange('merchantFullName', event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="Например, ИП Иванов Иван Иванович"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700" htmlFor="merchant-short-name">
              Краткое название для чека
            </label>
            <input
              id="merchant-short-name"
              type="text"
              value={formState.merchantShortName}
              onChange={(event) => handleFieldChange('merchantShortName', event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="Отображается в письмах и уведомлениях"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700" htmlFor="merchant-address">
              Юридический адрес
            </label>
            <textarea
              id="merchant-address"
              value={formState.merchantAddress}
              onChange={(event) => handleFieldChange('merchantAddress', event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              rows={3}
              placeholder="Город, улица, дом, офис"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Банковские реквизиты</h2>
          <p className="mt-1 text-sm text-gray-600">
            Используются YooKassa для сверки платежей и могут потребоваться для бухгалтерских документов.
          </p>
        </div>
        <div className="grid gap-6 p-6 lg:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="bank-name">
              Наименование банка
            </label>
            <input
              id="bank-name"
              type="text"
              value={formState.merchantBankName}
              onChange={(event) => handleFieldChange('merchantBankName', event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="Например, АО «Тинькофф Банк»"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="bank-bic">
              БИК
            </label>
            <input
              id="bank-bic"
              type="text"
              inputMode="numeric"
              value={formState.merchantBic}
              onChange={(event) => handleFieldChange('merchantBic', event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="9 цифр"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="bank-account">
              Расчётный счёт
            </label>
            <input
              id="bank-account"
              type="text"
              inputMode="numeric"
              value={formState.merchantBankAccount}
              onChange={(event) => handleFieldChange('merchantBankAccount', event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="20 цифр"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="bank-corr-account">
              Корреспондентский счёт
            </label>
            <input
              id="bank-corr-account"
              type="text"
              inputMode="numeric"
              value={formState.merchantCorrAccount}
              onChange={(event) => handleFieldChange('merchantCorrAccount', event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="20 цифр"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Фискальные настройки</h2>
          <p className="mt-1 text-sm text-gray-600">
            Управляйте чековыми данными: включайте передачу чеков, выбирайте систему налогообложения и ставку НДС.
          </p>
        </div>
        <div className="grid gap-6 p-6 lg:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Передавать чеки в YooKassa</label>
            <button
              type="button"
              onClick={handleReceiptToggle}
              className={`mt-2 inline-flex w-20 items-center justify-between rounded-full border px-2 py-1 text-xs font-medium transition ${
                formState.receiptEnabled
                  ? 'border-green-200 bg-green-100 text-green-700'
                  : 'border-gray-200 bg-gray-100 text-gray-600'
              }`}
            >
              <span>{formState.receiptEnabled ? 'Вкл.' : 'Выкл.'}</span>
              <span
                className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${
                  formState.receiptEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <p className="mt-1 text-xs text-gray-500">
              Если выключить, чеки будет формировать внешняя касса, а YooKassa получит только оплату.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="tax-system">
              Код системы налогообложения
            </label>
            <select
              id="tax-system"
              value={formState.taxSystemCode === null || formState.taxSystemCode === undefined ? '' : String(formState.taxSystemCode)}
              onChange={(event) => handleTaxChange(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              {taxSystemOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Сверьтесь с документацией YooKassa, чтобы указать код, соответствующий вашей системе налогообложения.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="vat-code">
              Код ставки НДС
            </label>
            <select
              id="vat-code"
              value={formState.vatCode === null || formState.vatCode === undefined ? '' : String(formState.vatCode)}
              onChange={(event) => handleVatChange(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              {vatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Используется для каждого товара чека. YooKassa требует коды 1–6 согласно своей спецификации.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="return-url">
              URL возврата после оплаты
            </label>
            <input
              id="return-url"
              type="url"
              value={formState.returnUrl}
              onChange={(event) => handleFieldChange('returnUrl', event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="https://kyanchir.ru/checkout/success"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Контакты для YooKassa</h2>
          <p className="mt-1 text-sm text-gray-600">
            Укажите телефон и email для уведомлений YooKassa и поддержки клиентов.
          </p>
        </div>
        <div className="grid gap-6 p-6 lg:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="contact-phone">
              Телефон
            </label>
            <input
              id="contact-phone"
              type="tel"
              value={formState.contactPhone}
              onChange={(event) => handleFieldChange('contactPhone', event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="+7 (999) 000-00-00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="contact-email">
              Email
            </label>
            <input
              id="contact-email"
              type="email"
              value={formState.contactEmail}
              onChange={(event) => handleFieldChange('contactEmail', event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              placeholder="support@kyanchir.ru"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">Последнее сохранение</p>
          <p className="text-sm text-gray-600">{formatUpdatedAt(lastSavedAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <LoadingButton
            type="submit"
            isLoading={isSaving}
            disabled={!isDirty || isSaving}
            className="inline-flex items-center rounded-md bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Сохранить изменения
          </LoadingButton>
          <p className="text-xs text-gray-500">
            После сохранения реквизиты можно посмотреть на странице «Предпросмотр реквизитов».
          </p>
        </div>
      </div>
    </form>
  );
}
