// Местоположение: src/components/admin/product-table/EditableCountdownTimer.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { VariantWithProductInfo } from '@/app/admin/dashboard/page';

export const EditableCountdownTimer = ({
  variant,
  hasDiscount,
  onUpdate,
}: {
  variant: VariantWithProductInfo;
  hasDiscount: boolean;
  onUpdate: (field: keyof VariantWithProductInfo, value: any) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [msLeft, setMsLeft] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [editHours, setEditHours] = useState('00');
  const [editMinutes, setEditMinutes] = useState('00');
  const [editSeconds, setEditSeconds] = useState('00');

  const calculateMsLeft = useCallback(() => {
    if (!variant.discountExpiresAt) return 0;
    const diff =
      new Date(variant.discountExpiresAt).getTime() - new Date().getTime();
    return Math.max(0, diff);
  }, [variant.discountExpiresAt]);

  useEffect(() => {
    setMsLeft(calculateMsLeft());
  }, [variant.discountExpiresAt, calculateMsLeft]);

  useEffect(() => {
    if (isPaused || msLeft <= 0 || isEditing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setMsLeft((prev) => Math.max(0, prev - 1000));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPaused, msLeft, isEditing]);

  const formatTime = (ms: number) => {
    if (ms <= 0) {
      if (!variant.discountExpiresAt) return hasDiscount ? 'Бессрочно' : '-';
      return 'Истекла';
    }
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((ms / 1000 / 60) % 60);
    const seconds = Math.floor((ms / 1000) % 60);
    return `${days > 0 ? `${days}д ` : ''}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleEditClick = () => {
    if (isEditing) return;
    const hours = Math.floor((msLeft / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((msLeft / 1000 / 60) % 60);
    const seconds = Math.floor((msLeft / 1000) % 60);
    setEditHours(hours.toString().padStart(2, '0'));
    setEditMinutes(minutes.toString().padStart(2, '0'));
    setEditSeconds(seconds.toString().padStart(2, '0'));
    setIsEditing(true);
  };

  const handleSave = () => {
    const totalMs =
      (parseInt(editHours) * 3600 +
        parseInt(editMinutes) * 60 +
        parseInt(editSeconds)) *
      1000;
    const newExpiryDate = new Date(Date.now() + totalMs);
    onUpdate('discountExpiresAt', newExpiryDate);
    setIsEditing(false);
    setIsPaused(false);
  };

  const handlePauseToggle = () => {
    if (isPaused) {
      const newExpiryDate = new Date(Date.now() + msLeft);
      onUpdate('discountExpiresAt', newExpiryDate);
    }
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    onUpdate('discountExpiresAt', null);
    onUpdate('oldPrice', null);
  };

  if (!hasDiscount) {
    return (
      <div className="inline-flex h-6 min-w-[7ch] items-center justify-center rounded-md px-1.5 text-gray-500">
        <span>-</span>
      </div>
    );
  }

  return (
    <div className="group relative inline-flex h-6 min-w-[7ch] items-center justify-center rounded-md bg-blue-100 px-1.5 text-blue-800">
      <div
        onClick={handleEditClick}
        className={`cursor-pointer font-mono transition-opacity ${isEditing ? 'opacity-0' : 'opacity-100'}`}
      >
        {formatTime(msLeft)}
      </div>

      <div
        className={`absolute inset-0 flex items-center justify-center gap-3 rounded-md bg-white/70 backdrop-blur-sm transition-opacity ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
      >
        {isEditing ? (
          <>
            <input
              type="text"
              value={editHours}
              onChange={(e) => setEditHours(e.target.value)}
              className="w-6 border-b border-blue-400 bg-transparent p-0 text-center focus:ring-0"
            />
            :
            <input
              type="text"
              value={editMinutes}
              onChange={(e) => setEditMinutes(e.target.value)}
              className="w-6 border-b border-blue-400 bg-transparent p-0 text-center focus:ring-0"
            />
            :
            <input
              type="text"
              value={editSeconds}
              onChange={(e) => setEditSeconds(e.target.value)}
              className="w-6 border-b border-blue-400 bg-transparent p-0 text-center focus:ring-0"
            />
            <button
              onClick={handleSave}
              className="text-xs font-semibold text-green-600"
            >
              ✓
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="text-xs font-bold text-red-500"
            >
              ✕
            </button>
          </>
        ) : (
          <>
            {/* --- ИЗМЕНЕНИЕ: Добавлена кнопка редактирования --- */}
            <button onClick={handleEditClick} className="text-sm">
              ✏️
            </button>
            <button onClick={handlePauseToggle} className="text-xs font-bold">
              {isPaused ? '▶' : '❚❚'}
            </button>
            <button
              onClick={handleReset}
              className="text-xs font-bold text-red-500"
            >
              ✕
            </button>
          </>
        )}
      </div>
    </div>
  );
};
