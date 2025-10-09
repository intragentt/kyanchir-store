'use client';

import { useCallback, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { LoadingButton } from '@/components/shared/ui/LoadingButton';
type RewardType = 'DISCOUNT' | 'BONUS';

type FormState = {
  code: string;
  rewardType: RewardType;
  discountValue: string;
  bonusPoints: string;
  usageLimit: string;
  stackWithPoints: boolean;
  expiresAt: string;
  description: string;
};

const DEFAULT_STATE: FormState = {
  code: '',
  rewardType: 'DISCOUNT',
  discountValue: '',
  bonusPoints: '',
  usageLimit: '',
  stackWithPoints: true,
  expiresAt: '',
  description: '',
};

function normalizeNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function CreatePromoCodeForm() {
  const [formState, setFormState] = useState<FormState>(DEFAULT_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDiscount = formState.rewardType === 'DISCOUNT';
  const isBonus = formState.rewardType === 'BONUS';

  const isSubmitDisabled = useMemo(() => {
    if (!formState.code.trim()) {
      return true;
    }

    if (isDiscount && !formState.discountValue.trim()) {
      return true;
    }

    if (isBonus && !formState.bonusPoints.trim()) {
      return true;
    }

    return false;
  }, [formState, isBonus, isDiscount]);

  const handleChange = useCallback(<Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleRewardTypeChange = useCallback((type: RewardType) => {
    setFormState((prev) => ({
      ...prev,
      rewardType: type,
      discountValue: type === 'DISCOUNT' ? prev.discountValue : '',
      bonusPoints: type === 'BONUS' ? prev.bonusPoints : '',
    }));
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      setIsSubmitting(true);

      try {
        const payload: Record<string, unknown> = {
          code: formState.code.trim().toUpperCase(),
          rewardType: formState.rewardType,
          stackWithPoints: formState.stackWithPoints,
          description: formState.description.trim() || undefined,
          usageLimit: normalizeNumber(formState.usageLimit),
          expiresAt: formState.expiresAt ? new Date(formState.expiresAt).toISOString() : null,
        };

        if (isDiscount) {
          payload.discountValue = normalizeNumber(formState.discountValue);
        }

        if (isBonus) {
          payload.bonusPoints = normalizeNumber(formState.bonusPoints);
        }

        const response = await fetch('/api/admin/promo-codes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || 'Не удалось создать промокод');
        }

        toast.success(data?.message || 'Промокод создан');
        setFormState(DEFAULT_STATE);
      } catch (error) {
        console.error('[CreatePromoCodeForm] Ошибка создания промокода', error);
        toast.error(error instanceof Error ? error.message : 'Неизвестная ошибка');
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState, isBonus, isDiscount],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <label className="block text-sm font-medium text-gray-700">
          Промокод
          <input
            type="text"
            value={formState.code}
            onChange={(event) => handleChange('code', event.target.value.toUpperCase())}
            placeholder="SPRING2025"
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase shadow-sm focus:border-gray-900 focus:outline-none"
            required
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Ограничение по использованию
          <input
            type="number"
            min={1}
            value={formState.usageLimit}
            onChange={(event) => handleChange('usageLimit', event.target.value)}
            placeholder="Необязательно"
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
          />
        </label>
      </div>

      <fieldset className="rounded-lg border border-gray-200 p-4">
        <legend className="px-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Тип вознаграждения
        </legend>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => handleRewardTypeChange('DISCOUNT')}
            className={`rounded-md border px-4 py-3 text-left text-sm font-semibold transition ${
              isDiscount
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            💸 Скидка на заказ
            <span className="mt-1 block text-xs font-normal text-gray-500">
              Фиксированная сумма списывается при оплате
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleRewardTypeChange('BONUS')}
            className={`rounded-md border px-4 py-3 text-left text-sm font-semibold transition ${
              isBonus
                ? 'border-violet-600 bg-violet-600 text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            🎁 Бонусные баллы
            <span className="mt-1 block text-xs font-normal text-gray-500">
              Баллы начисляются на аккаунт пользователя
            </span>
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {isDiscount && (
            <label className="block text-sm font-medium text-gray-700">
              Сумма скидки (₽)
              <input
                type="number"
                min={1}
                value={formState.discountValue}
                onChange={(event) => handleChange('discountValue', event.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
                required
              />
            </label>
          )}

          {isBonus && (
            <label className="block text-sm font-medium text-gray-700">
              Бонусные баллы
              <input
                type="number"
                min={1}
                value={formState.bonusPoints}
                onChange={(event) => handleChange('bonusPoints', event.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
                required
              />
            </label>
          )}

          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={formState.stackWithPoints}
              onChange={(event) => handleChange('stackWithPoints', event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            Разрешить оплачивать частично баллами и промокодом
          </label>
        </div>
      </fieldset>

      <div className="grid gap-6 md:grid-cols-2">
        <label className="block text-sm font-medium text-gray-700">
          Срок действия
          <input
            type="datetime-local"
            value={formState.expiresAt}
            onChange={(event) => handleChange('expiresAt', event.target.value)}
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Описание (необязательно)
          <input
            type="text"
            value={formState.description}
            onChange={(event) => handleChange('description', event.target.value)}
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none"
            placeholder="Например: для первых заказов"
          />
        </label>
      </div>

      <div className="flex justify-end">
        <LoadingButton
          type="submit"
          isLoading={isSubmitting}
          disabled={isSubmitDisabled}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500"
        >
          Создать промокод
        </LoadingButton>
      </div>
    </form>
  );
}
