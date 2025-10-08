// Местоположение: src/components/admin/users/UserTableRow.tsx

'use client';

import { memo, useMemo } from 'react';
import Image from 'next/image';
import UserActions from './UserActions';
import type { AdminUserRecord } from '@/lib/admin/users';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Администратор',
  MANAGEMENT: 'Менеджер',
  SUPPORT: 'Поддержка',
  USER: 'Пользователь',
};

interface UserTableRowProps {
  /**
   * 👤 Данные пользователя
   */
  user: AdminUserRecord;
  /**
   * 🙋 Флаг, что это текущий администратор
   */
  isSelf: boolean;
  /**
   * 🔁 Колбэк после изменения данных
   */
  onActionComplete?: () => void;
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Нет данных';
  }
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * 👤 СТРОКА ПОЛЬЗОВАТЕЛЯ В ТАБЛИЦЕ
 *
 * Показывает информацию об одном пользователе.
 */
const UserTableRow = memo(function UserTableRow({
  user,
  isSelf,
  onActionComplete,
}: UserTableRowProps) {
  console.log('🔄 UserTableRow: рендер строки', { id: user.id });

  const statusBadge = useMemo(() => {
    const base = 'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold';
    switch (user.status) {
      case 'active':
        return `${base} bg-emerald-100 text-emerald-800`;
      case 'pending':
        return `${base} bg-amber-100 text-amber-800`;
      case 'blocked':
        return `${base} bg-rose-100 text-rose-800`;
      default:
        return `${base} bg-gray-100 text-gray-600`;
    }
  }, [user.status]);

  const initials = useMemo(() => {
    const firstInitial = user.firstName?.charAt(0) ?? '';
    const lastInitial = user.lastName?.charAt(0) ?? '';
    const fallback = user.email?.charAt(0) ?? 'K';
    return (firstInitial + lastInitial || fallback).toUpperCase();
  }, [user.firstName, user.lastName, user.email]);

  const roleLabel = ROLE_LABELS[user.role] ?? user.role;

  return (
    <tr className="hover:bg-gray-50">
      <td className="whitespace-nowrap px-4 py-4">
        <div className="flex items-center gap-3">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={`Аватар ${user.fullName}`}
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
              {initials}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{user.fullName}</p>
            <p className="text-sm text-gray-500" title={user.id}>
              ID: {user.displayId}
            </p>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
        <div className="flex flex-col">
          {user.email ? (
            <span className="truncate" title={user.email}>
              📧 {user.email}
            </span>
          ) : (
            <span className="text-gray-400">Нет email</span>
          )}
          {user.phone ? (
            <span className="truncate" title={user.phone}>
              📱 {user.phone}
            </span>
          ) : (
            <span className="text-gray-400">Телефон не указан</span>
          )}
          <span className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500">
            <span className="inline-block h-2 w-2 rounded-full bg-gray-400" aria-hidden />
            Роль: {roleLabel}
          </span>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm">
        <span className={statusBadge} aria-label={`Статус: ${user.status}`}>
          {user.status === 'active'
            ? 'Активен'
            : user.status === 'pending'
            ? 'Ожидает'
            : 'Заблокирован'}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{user.ordersCount}</span>
          <span className="text-xs text-gray-500">{formatCurrency(user.totalSpent)}</span>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">{user.bonusPoints}</span>
          <span className="text-xs text-gray-500">баллов</span>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
        {formatDate(user.createdAt)}
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
        {formatDate(user.lastLoginAt)}
      </td>
      <td className="whitespace-nowrap px-4 py-4">
        <UserActions user={user} isSelf={isSelf} onCompleted={onActionComplete} />
      </td>
    </tr>
  );
});

export default UserTableRow;
export type { UserTableRowProps };
