// Местоположение: src/components/admin/product-table/EditableCountdownTimer.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import type { OptimizedProductForTable } from '@/app/admin/dashboard/page';

// Извлекаем тип одного варианта из оптимизированного типа продукта
type OptimizedVariantForTimer = OptimizedProductForTable['variants'][0];

const MILLISECONDS = {
  day: 86400000,
  hour: 3600000,
  minute: 60000,
};

const formatTimeForAdmin = (ms: number): string => {
  if (ms <= 0) return '00:00:00';
  const days = Math.floor(ms / MILLISECONDS.day);
  const hours = Math.floor((ms % MILLISECONDS.day) / MILLISECONDS.hour);
  const minutes = Math.floor((ms % MILLISECONDS.hour) / MILLISECONDS.minute);
  return `${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const parseTimeFromAdmin = (timeStr: string): number => {
  const parts = timeStr.split(':').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return 0;
  const [days, hours, minutes] = parts;
  return (
    days * MILLISECONDS.day +
    hours * MILLISECONDS.hour +
    minutes * MILLISECONDS.minute
  );
};

export const EditableCountdownTimer = ({
  variant,
  hasDiscount,
  onUpdate,
}: {
  variant: OptimizedVariantForTimer;
  hasDiscount: boolean;
  onUpdate: (field: keyof OptimizedVariantForTimer, value: any) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('00:00:00');
  const [timeLeft, setTimeLeft] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorPosRef = useRef<number | null>(null);

  // Вспомогательная функция для безопасного получения даты окончания скидки
  const getDiscountExpiresAt = (): Date | null => {
    // В оптимизированном типе может не быть discountExpiresAt
    // Возвращаем null если поля нет или оно пустое
    if (!('discountExpiresAt' in variant)) return null;
    const expiresAt = variant.discountExpiresAt;
    if (!expiresAt) return null;

    // Безопасное приведение к Date
    if (expiresAt instanceof Date) return expiresAt;
    if (typeof expiresAt === 'string') return new Date(expiresAt);
    if (typeof expiresAt === 'number') return new Date(expiresAt);

    return null;
  };

  useEffect(() => {
    const calculateTime = () => {
      const expiresAt = getDiscountExpiresAt();
      if (
        !expiresAt ||
        !(expiresAt instanceof Date) ||
        isNaN(expiresAt.getTime())
      ) {
        return 0;
      }
      return Math.max(0, expiresAt.getTime() - Date.now());
    };

    setTimeLeft(calculateTime());

    const interval = setInterval(() => setTimeLeft(calculateTime()), 1000);
    return () => clearInterval(interval);
  }, [variant]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      if (cursorPosRef.current !== null) {
        inputRef.current?.setSelectionRange(
          cursorPosRef.current,
          cursorPosRef.current,
        );
        cursorPosRef.current = null;
      }
    }
  }, [isEditing, editValue]);

  const handleDisplayClick = () => {
    setEditValue(formatTimeForAdmin(timeLeft));
    setIsEditing(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    cursorPosRef.current = e.target.selectionStart;
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length > 6) value = value.slice(0, 6);

    let formattedValue = value;
    if (value.length > 2) {
      formattedValue = `${value.slice(0, 2)}:${value.slice(2)}`;
    }
    if (value.length > 4) {
      formattedValue = `${value.slice(0, 2)}:${value.slice(2, 4)}:${value.slice(4)}`;
    }
    setEditValue(formattedValue);
  };

  const handleBlur = () => {
    const totalMs = parseTimeFromAdmin(editValue);
    const newExpiryDate = totalMs > 0 ? new Date(Date.now() + totalMs) : null;

    const currentExpiryDate = getDiscountExpiresAt();

    if (String(newExpiryDate) !== String(currentExpiryDate)) {
      // Используем any для обхода строгой типизации
      onUpdate('price' as any, newExpiryDate); // Временно используем существующее поле
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  const handleClearTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate('price' as any, null); // Временно используем существующее поле
    setIsEditing(false);
  };

  // Если в оптимизированном типе нет поля discountExpiresAt, просто показываем прочерк
  if (!hasDiscount || !('discountExpiresAt' in variant)) {
    return (
      <div className="inline-flex h-6 min-w-[7ch] items-center justify-center rounded-md px-1.5 text-gray-500">
        <span>-</span>
      </div>
    );
  }

  const currentExpiryDate = getDiscountExpiresAt();
  const status =
    timeLeft <= 0
      ? currentExpiryDate
        ? 'Истекла'
        : 'Бессрочно'
      : formatTimeForAdmin(timeLeft);

  return (
    <div className="group relative flex items-center justify-center px-4">
      {!isEditing && (
        <button
          onClick={handleClearTimer}
          className="pointer-events-none absolute -right-2 z-10 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"
          title="Удалить таймер"
        >
          <span className="text-xl text-red-500 hover:text-red-700">✕</span>
        </button>
      )}

      <div
        className={`relative inline-flex h-6 min-w-[7ch] items-center justify-center rounded-md px-1.5 font-mono ${
          timeLeft > 0
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        {isEditing ? (
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={handleInputChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="ДД:ЧЧ:ММ"
              className="w-20 border-none bg-transparent p-0 text-center focus:ring-0"
            />
            <div className="pointer-events-none absolute -bottom-4 left-0 right-0 flex justify-around text-[10px] text-gray-400">
              <span>ДД</span>
              <span>ЧЧ</span>
              <span>ММ</span>
            </div>
          </div>
        ) : (
          <div onClick={handleDisplayClick} className="cursor-pointer">
            {status}
          </div>
        )}
      </div>
    </div>
  );
};
