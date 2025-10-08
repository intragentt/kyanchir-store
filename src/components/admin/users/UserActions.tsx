// Местоположение: src/components/admin/users/UserActions.tsx

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { LoadingButton } from '@/components/shared/ui';
import type { AdminUserRecord } from '@/lib/admin/users';
import { logEvent } from '@/lib/monitoring';

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'ADMIN', label: 'Администратор' },
  { value: 'MANAGEMENT', label: 'Менеджер' },
  { value: 'SUPPORT', label: 'Поддержка' },
  { value: 'USER', label: 'Пользователь' },
];

interface UserActionsProps {
  /**
   * 👤 Пользователь, над которым выполняются действия
   */
  user: AdminUserRecord;
  /**
   * 🙅 Нельзя заблокировать самого себя
   */
  isSelf: boolean;
  /**
   * 🔁 Колбэк после завершения действия
   */
  onCompleted?: () => void;
}

/**
 * ⚙️ ДЕЙСТВИЯ НАД ПОЛЬЗОВАТЕЛЕМ
 *
 * Блокировка, изменение роли, просмотр профиля.
 */
export default function UserActions({ user, isSelf, onCompleted }: UserActionsProps) {
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setSelectedRole(user.role);
  }, [user.role]);

  const roleOptions = useMemo(() => {
    if (ROLE_OPTIONS.some((option) => option.value === user.role)) {
      return ROLE_OPTIONS;
    }

    return [{ value: user.role, label: user.role }, ...ROLE_OPTIONS];
  }, [user.role]);

  const handleRoleChange = useCallback(async () => {
    console.log('🔄 UserActions: изменение роли', { id: user.id });

    if (selectedRole === user.role) {
      toast('Выберите новую роль для сохранения');
      return;
    }

    setIsUpdatingRole(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || 'Не удалось изменить роль пользователя');
      }

      toast.success('Роль пользователя обновлена');
      logEvent({
        type: 'admin.users.role-updated',
        timestamp: Date.now(),
        payload: { userId: user.id, role: selectedRole },
      });
      onCompleted?.();
    } catch (error) {
      console.error('❌ UserActions: ошибка изменения роли', error);
      toast.error(error instanceof Error ? error.message : 'Не удалось изменить роль пользователя');
    } finally {
      setIsUpdatingRole(false);
    }
  }, [onCompleted, selectedRole, user.id, user.role]);

  const handleDelete = useCallback(async () => {
    if (isSelf) {
      toast.error('Нельзя удалить свой собственный аккаунт');
      return;
    }

    const shouldDelete = window.confirm(
      `Вы уверены, что хотите удалить пользователя «${user.fullName}»? Действие необратимо.`,
    );

    if (!shouldDelete) {
      return;
    }

    console.log('🔄 UserActions: удаление пользователя', { id: user.id });
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || 'Не удалось удалить пользователя');
      }

      toast.success('Пользователь удалён');
      logEvent({
        type: 'admin.users.deleted',
        timestamp: Date.now(),
        payload: { userId: user.id },
      });
      onCompleted?.();
    } catch (error) {
      console.error('❌ UserActions: ошибка удаления пользователя', error);
      toast.error(error instanceof Error ? error.message : 'Не удалось удалить пользователя');
    } finally {
      setIsDeleting(false);
    }
  }, [isSelf, onCompleted, user.fullName, user.id]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Роль
          <select
            value={selectedRole}
            onChange={(event) => setSelectedRole(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <LoadingButton
          type="button"
          isLoading={isUpdatingRole}
          onClick={handleRoleChange}
          className="bg-white text-gray-700 hover:bg-gray-100"
        >
          Сохранить роль
        </LoadingButton>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <LoadingButton
          type="button"
          isLoading={isDeleting}
          onClick={handleDelete}
          className="bg-rose-600 text-white hover:bg-rose-500"
        >
          Удалить
        </LoadingButton>

        <Link
          href={user.email ? `mailto:${user.email}` : '#'}
          aria-disabled={!user.email}
          className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 aria-disabled:pointer-events-none aria-disabled:opacity-60"
        >
          Связаться
        </Link>
      </div>
    </div>
  );
}

export type { UserActionsProps };
