// Местоположение: src/components/admin/users/UsersTable.tsx

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  AdminUserRecord,
  AdminUserSortKey,
  AdminUsersSummary,
} from '@/lib/admin/users';
import { SkeletonLoader, LoadingButton, ToastViewport } from '@/components/shared/ui';
import { useDebounce } from '@/hooks/useDebounce';
import { useRetry } from '@/hooks/useRetry';
import { logEvent } from '@/lib/monitoring';
import UserTableRow from './UserTableRow';
import UserFilters from './UserFilters';

interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

type SortKey = AdminUserSortKey;

interface UsersTableProps {
  /**
   * 📦 Начальные пользователи, отрендеренные на сервере
   */
  initialUsers: AdminUserRecord[];
  /**
   * 🧭 Начальные параметры пагинации
   */
  initialMeta: PaginationMeta;
  /**
   * 📈 Сводная статистика по выборке
   */
  initialSummary: AdminUsersSummary;
  /**
   * 🆔 Текущий пользователь (для ограничения действий)
   */
  currentUserId: string;
}

/**
 * 👥 ТАБЛИЦА УПРАВЛЕНИЯ ПОЛЬЗОВАТЕЛЯМИ
 *
 * Отображает всех пользователей системы с возможностью управления.
 */
export default function UsersTable({
  initialUsers,
  initialMeta,
  initialSummary,
  currentUserId,
}: UsersTableProps) {
  console.log('🔄 UsersTable: инициализация компонента');

  const [users, setUsers] = useState<AdminUserRecord[]>(initialUsers);
  const [meta, setMeta] = useState<PaginationMeta>(initialMeta);
  const [summary, setSummary] = useState<AdminUsersSummary>(initialSummary);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortKey>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(initialMeta.page);
  const [perPage, setPerPage] = useState(initialMeta.perPage);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const debouncedSearch = useDebounce(search, 400, { maxWait: 1200 });
  const handleRetryToast = useCallback((attempt: number) => {
    toast.loading(`Повторная попытка загрузки (${attempt + 1})...`, {
      id: 'users-retry',
    });
  }, []);
  const { execute } = useRetry({
    retries: 2,
    delay: 600,
    onRetry: handleRetryToast,
  });

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
      sortBy,
      sortOrder,
    });

    if (debouncedSearch) {
      params.set('search', debouncedSearch);
    }
    if (roleFilter !== 'all') {
      params.set('role', roleFilter);
    }
    if (statusFilter !== 'all') {
      params.set('status', statusFilter);
    }

    const load = async () => {
      console.log('🔄 UsersTable: загрузка данных', Object.fromEntries(params.entries()));
      setIsLoading(true);
      try {
        const response = await execute(async () => {
          const result = await fetch(`/api/admin/users?${params.toString()}`, {
            signal: controller.signal,
          });

          if (!result.ok) {
            const errorText = await result.text();
            const error = new Error(errorText || 'Ошибка загрузки пользователей');
            (error as any).skipRetry = result.status >= 400 && result.status < 500;
            throw error;
          }

          return result.json();
        });

        setUsers(response.data);
        setMeta(response.meta);
        setSummary(response.summary);
        setPage(response.meta.page);
        setPerPage(response.meta.perPage);

        logEvent({
          type: 'admin.users.loaded',
          timestamp: Date.now(),
          payload: {
            total: response.meta.total,
            page: response.meta.page,
          },
        });

        console.log('✅ UsersTable: данные успешно обновлены');
      } catch (error) {
        if (controller.signal.aborted) {
          console.log('⚠️ UsersTable: запрос был отменён');
          return;
        }
        console.error('❌ UsersTable: ошибка загрузки', error);
        toast.error('Не удалось загрузить пользователей. Попробуйте ещё раз.');
      } finally {
        toast.dismiss('users-retry');
        setIsLoading(false);
      }
    };

    load();

    return () => {
      controller.abort();
    };
  }, [debouncedSearch, roleFilter, statusFilter, sortBy, sortOrder, page, perPage, refreshKey, execute]);

  const handleRoleChange = useCallback((value: string) => {
    console.log('🔄 UsersTable: изменение фильтра роли', { value });
    setRoleFilter(value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    console.log('🔄 UsersTable: изменение статуса', { value });
    setStatusFilter(value);
    setPage(1);
  }, []);

  const handleSortByChange = useCallback((value: SortKey) => {
    console.log('🔄 UsersTable: изменение сортировки', { value });
    setSortBy(value);
    setPage(1);
  }, []);

  const handleSortOrderToggle = useCallback(() => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  const handlePerPageChange = useCallback((value: number) => {
    console.log('🔄 UsersTable: изменение perPage', { value });
    setPerPage(value);
    setPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    console.log('🔄 UsersTable: ручное обновление');
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      if (nextPage < 1 || nextPage > meta.totalPages) return;
      console.log('🔄 UsersTable: смена страницы', { nextPage });
      setPage(nextPage);
    },
    [meta.totalPages],
  );

  const summaryCards = useMemo(
    () => [
      { label: 'Всего', value: summary.total, accent: 'text-blue-600' },
      { label: 'Активные', value: summary.active, accent: 'text-green-600' },
      { label: 'Ожидают', value: summary.pending, accent: 'text-amber-600' },
      { label: 'Администраторы', value: summary.admin, accent: 'text-purple-600' },
    ],
    [summary],
  );

  return (
    <div className="space-y-6">
      <ToastViewport />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className={`text-2xl font-bold ${card.accent}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <UserFilters
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          role={roleFilter}
          onRoleChange={handleRoleChange}
          status={statusFilter}
          onStatusChange={handleStatusChange}
          sortBy={sortBy}
          onSortByChange={(value) => handleSortByChange(value)}
          sortOrder={sortOrder}
          onSortOrderToggle={handleSortOrderToggle}
          perPage={perPage}
          onPerPageChange={handlePerPageChange}
          isLoading={isLoading}
          onReset={() => {
            setSearch('');
            setRoleFilter('all');
            setStatusFilter('all');
            setSortBy('createdAt');
            setSortOrder('desc');
            setPerPage(initialMeta.perPage);
            setPage(1);
          }}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Список пользователей</h2>
            <p className="text-sm text-gray-500">
              Показано {users.length} из {meta.total} пользователей
            </p>
          </div>
          <LoadingButton
            type="button"
            isLoading={isLoading}
            onClick={handleRefresh}
            className="bg-gray-900 text-white hover:bg-gray-800"
          >
            Обновить
          </LoadingButton>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Пользователь
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Контакты
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Статус
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Заказы
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Конусные баллы
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Создан
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Последний вход
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6">
                    <SkeletonLoader rows={Math.min(perPage, 5)} columns={6} />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500">
                    Пользователи не найдены. Попробуйте изменить условия фильтра.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <UserTableRow
                    key={user.id}
                    user={user}
                    isSelf={user.id === currentUserId}
                    onActionComplete={handleRefresh}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 p-4 text-sm text-gray-600">
          <p>
            Страница {meta.page} из {meta.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(meta.page - 1)}
              disabled={meta.page <= 1 || isLoading}
              className="rounded-md border border-gray-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Назад
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(meta.page + 1)}
              disabled={meta.page >= meta.totalPages || isLoading}
              className="rounded-md border border-gray-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Вперёд
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
