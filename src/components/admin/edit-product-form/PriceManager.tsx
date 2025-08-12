// Местоположение: src/components/admin/edit-product-form/PriceManager.tsx
'use client';

import { useState, useEffect } from 'react';

interface PriceManagerProps {
  price: number;
  oldPrice: number | null;
  bonusPoints: number | null;
  onPriceChange: (field: string, value: number | null) => void;
  discountTimerEnabled: boolean;
  onDiscountTimerToggle: (enabled: boolean) => void;
  discountHours: number;
  onDiscountHoursChange: (hours: number) => void;
  // VVV--- ИЗМЕНЕНИЕ: Добавляем пропсы для минут ---VVV
  discountMinutes: number;
  onDiscountMinutesChange: (minutes: number) => void;
}

export default function PriceManager({
  price,
  oldPrice,
  bonusPoints,
  onPriceChange,
  discountTimerEnabled,
  onDiscountTimerToggle,
  discountHours,
  onDiscountHoursChange,
  discountMinutes,
  onDiscountMinutesChange,
}: PriceManagerProps) {
  const [hasDiscount, setHasDiscount] = useState(!!oldPrice);
  const [discountPercentage, setDiscountPercentage] = useState(0);

  useEffect(() => {
    const basePrice = oldPrice || price;
    if (hasDiscount && basePrice && price) {
      const percentage = Math.round(((basePrice - price) / basePrice) * 100);
      setDiscountPercentage(percentage > 0 ? percentage : 0);
    } else {
      setDiscountPercentage(0);
    }
  }, [price, oldPrice, hasDiscount]);

  const handleDiscountToggle = (isChecked: boolean) => {
    setHasDiscount(isChecked);
    if (isChecked) {
      onPriceChange('oldPrice', price);
    } else {
      onPriceChange('oldPrice', null);
      onDiscountTimerToggle(false);
    }
  };

  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="mb-4 text-lg font-semibold text-gray-800">
        Цена и бонусы
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-gray-700"
            >
              {hasDiscount ? 'Старая цена (без скидки)' : 'Цена'}
            </label>
            <input
              type="number"
              id="price"
              readOnly={hasDiscount}
              value={hasDiscount ? oldPrice || '' : price || ''}
              onChange={(e) =>
                onPriceChange('price', parseInt(e.target.value, 10))
              }
              className={`mt-1 block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${hasDiscount ? 'cursor-not-allowed bg-gray-200' : 'bg-gray-50'}`}
            />
          </div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={hasDiscount}
              onChange={(e) => handleDiscountToggle(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Установить скидку
            </span>
          </label>
        </div>

        {hasDiscount && (
          <div className="space-y-4 rounded-md border border-gray-200 bg-gray-50/50 p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="newPrice"
                  className="block text-sm font-medium text-gray-700"
                >
                  Новая цена (со скидкой)
                </label>
                <input
                  type="number"
                  id="newPrice"
                  value={price || ''}
                  onChange={(e) =>
                    onPriceChange('price', parseInt(e.target.value, 10))
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Скидка
                </label>
                <div className="mt-1 block w-full rounded-md border-gray-300 bg-gray-200 p-2 text-gray-500 shadow-sm">
                  {discountPercentage}%
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={discountTimerEnabled}
                  onChange={(e) => onDiscountTimerToggle(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Установить таймер на скидку
                </span>
              </label>
              {discountTimerEnabled && (
                // VVV--- ИЗМЕНЕНИЕ: Добавляем поле для минут ---VVV
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="discountHours"
                      className="block text-xs font-medium text-gray-500"
                    >
                      Часов:
                    </label>
                    <input
                      type="number"
                      id="discountHours"
                      value={discountHours || ''}
                      onChange={(e) =>
                        onDiscountHoursChange(parseInt(e.target.value, 10))
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="discountMinutes"
                      className="block text-xs font-medium text-gray-500"
                    >
                      Минут:
                    </label>
                    <input
                      type="number"
                      id="discountMinutes"
                      value={discountMinutes || ''}
                      onChange={(e) =>
                        onDiscountMinutesChange(parseInt(e.target.value, 10))
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="bonusPoints"
            className="block text-sm font-medium text-gray-700"
          >
            Бонусные баллы "К-койны"
          </label>
          <input
            type="number"
            id="bonusPoints"
            value={bonusPoints || ''}
            onChange={(e) =>
              onPriceChange('bonusPoints', parseInt(e.target.value, 10))
            }
            placeholder="Например, 150"
            className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>
    </div>
  );
}
