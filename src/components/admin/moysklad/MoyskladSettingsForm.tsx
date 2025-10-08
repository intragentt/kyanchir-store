'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { toast } from 'react-hot-toast';
import { LoadingButton } from '@/components/shared/ui';

interface MoyskladSettingsFormProps {
  hasStoredKey: boolean;
  lastFour: string | null;
  lastUpdatedAt: string | null;
}

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
    console.warn('[MoyskladSettingsForm] Не удалось отформатировать дату обновления', error);
    return '—';
  }
};

export default function MoyskladSettingsForm({
  hasStoredKey,
  lastFour,
  lastUpdatedAt,
}: MoyskladSettingsFormProps) {
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusLabel = useMemo(() => {
    if (!hasStoredKey) {
      return 'API-ключ ещё не сохранён';
    }

    if (lastFour) {
      return `Текущий ключ заканчивается на …${lastFour}`;
    }

    return 'API-ключ сохранён';
  }, [hasStoredKey, lastFour]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!apiKey.trim()) {
      toast.error('Введите API-ключ МойСклад');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Проверяем и сохраняем API-ключ…');

    try {
      const testResponse = await fetch('/api/admin/settings/test-moysklad-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const testData = await testResponse.json();

      if (!testResponse.ok || testData?.success === false) {
        throw new Error(testData?.error || 'Не удалось проверить API-ключ');
      }

      const saveResponse = await fetch('/api/admin/settings/moysklad-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const saveData = await saveResponse.json();

      if (!saveResponse.ok) {
        throw new Error(saveData?.error || 'Не удалось сохранить API-ключ');
      }

      toast.success(saveData?.message ?? 'API-ключ сохранён', { id: toastId });
      setApiKey('');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Не удалось обновить API-ключ',
        { id: toastId },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">🔑 API-ключ МойСклад</h2>
              <p className="mt-2 max-w-2xl text-sm text-gray-600">
                Ключ хранится в System Settings и используется всеми фоновыми задачами синхронизации.
                Вы можете обновить его в любое время, не дожидаясь ошибки авторизации.
              </p>
            </div>
            <dl className="grid gap-3 text-sm text-gray-600 sm:grid-cols-2">
              <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Статус</dt>
                <dd className="mt-1 text-gray-900">{statusLabel}</dd>
              </div>
              <div className="rounded-md border border-gray-100 bg-gray-50 p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Последнее обновление
                </dt>
                <dd className="mt-1 text-gray-900">{formatUpdatedAt(lastUpdatedAt)}</dd>
              </div>
            </dl>
          </div>
          <div className="flex flex-col gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <strong className="text-sm font-semibold">Как получить ключ</strong>
            <ol className="list-decimal space-y-1 pl-5">
              <li>МойСклад → Профиль → API-токены</li>
              <li>Сгенерируйте новый токен и скопируйте значение</li>
              <li>Вставьте его в поле ниже и сохраните</li>
            </ol>
            <p className="text-xs text-amber-800">
              После сохранения кэш в мосте МойСклад будет очищен автоматически.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <label htmlFor="moysklad-api-key" className="block text-sm font-medium text-gray-700">
          Новый API-ключ
        </label>
        <p className="mt-1 text-xs text-gray-500">
          Мы проверим ключ на доступ к эндпоинту <code>entity/organization</code> и только после этого обновим
          сохранённое значение.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            id="moysklad-api-key"
            name="moysklad-api-key"
            type="password"
            autoComplete="off"
            placeholder="Вставьте новый Bearer-токен..."
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            disabled={isSubmitting}
          />
          <LoadingButton
            type="submit"
            isLoading={isSubmitting}
            disabled={!apiKey.trim()}
            className="whitespace-nowrap"
          >
            Проверить и сохранить
          </LoadingButton>
        </div>
      </div>
    </form>
  );
}
