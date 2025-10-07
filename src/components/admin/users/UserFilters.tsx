// Местоположение: src/components/admin/users/UserFilters.tsx

'use client';

import { memo } from 'react';
import { LoadingButton } from '@/components/shared/ui';
import type { AdminUserSortKey } from '@/lib/admin/users';

interface UserFiltersProps {
  /**
   * 🔍 Текущее значение строки поиска
   */
  search: string;
  /**
   * ✏️ Обновление поиска
   */
  onSearchChange: (value: string) => void;
  /**
   * 🎯 Текущий фильтр по роли
   */
  role: string;
  onRoleChange: (value: string) => void;
  /**
   * 🚦 Текущий фильтр по статусу
   */
  status: string;
  onStatusChange: (value: string) => void;
  /**
   * 🧭 Поле сортировки
   */
  sortBy: AdminUserSortKey;
  onSortByChange: (value: AdminUserSortKey) => void;
  /**
   * ↕️ Направление сортировки
   */
  sortOrder: 'asc' | 'desc';
  onSortOrderToggle: () => void;
  /**
   * 📄 Размер страницы
   */
  perPage: number;
  onPerPageChange: (value: number) => void;
  /**
   * ⏳ Состояние загрузки
   */
  isLoading: boolean;
  /**
   * ♻️ Сброс фильтров
   */
  onReset: () => void;
}

const roleOptions = [
  { label: 'Все роли', value: 'all' },
  { label: 'Администраторы', value: 'ADMIN' },
  { label: 'Менеджеры', value: 'MANAGEMENT' },
  { label: 'Поддержка', value: 'SUPPORT' },
  { label: 'Пользователи', value: 'USER' },
];

const statusOptions = [
  { label: 'Все статусы', value: 'all' },
  { label: 'Активные', value: 'active' },
  { label: 'Ожидают подтверждения', value: 'pending' },
  { label: 'Заблокированные', value: 'blocked' },
];

const sortOptions: { label: string; value: AdminUserSortKey }[] = [
  { label: 'Дата создания', value: 'createdAt' },
  { label: 'Роль', value: 'role' },
  { label: 'Количество заказов', value: 'ordersCount' },
  { label: 'Сумма покупок', value: 'totalSpent' },
  { label: 'Последний вход', value: 'lastLoginAt' },
];

const perPageOptions = [10, 20, 30, 50, 100];

/**
 * 🔍 ФИЛЬТРЫ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ
 *
 * Поиск и фильтрация по различным критериям.
 */
const UserFilters = memo(function UserFilters({
  search,
  onSearchChange,
  role,
  onRoleChange,
  status,
  onStatusChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderToggle,
  perPage,
  onPerPageChange,
  isLoading,
  onReset,
}: UserFiltersProps) {
  console.log('🔄 UserFilters: рендер фильтров');

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
          Поиск
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Имя, email или телефон"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            autoComplete="off"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
          Роль
          <select
            value={role}
            onChange={(event) => onRoleChange(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
          Статус
          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
          Количество на странице
          <select
            value={perPage}
            onChange={(event) => onPerPageChange(Number.parseInt(event.target.value, 10))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            {perPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            Сортировка
            <select
              value={sortBy}
              onChange={(event) => onSortByChange(event.target.value as AdminUserSortKey)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={onSortOrderToggle}
            className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            {sortOrder === 'asc' ? 'По возрастанию' : 'По убыванию'}
          </button>
        </div>

        <LoadingButton
          type="button"
          isLoading={isLoading}
          onClick={onReset}
          className="self-start bg-white text-gray-700 hover:bg-gray-100"
        >
          Сбросить фильтры
        </LoadingButton>
      </div>
    </div>
  );
});

export default UserFilters;
export type { UserFiltersProps };
