// Местоположение: src/components/admin/users/UserActions.tsx

'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { LoadingButton } from '@/components/shared/ui';
import type { AdminUserRecord } from '@/lib/admin/users';
import { logEvent } from '@/lib/monitoring';

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
  const [isBlocking, setIsBlocking] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const simulateNetworkDelay = () => new Promise((resolve) => setTimeout(resolve, 600));

  const handleBlockToggle = useCallback(async () => {
    if (isSelf) {
      toast.error('Нельзя заблокировать свой собственный аккаунт');
      return;
    }

    console.log('🔄 UserActions: блокировка пользователя', { id: user.id });
    setIsBlocking(true);

    try {
      await simulateNetworkDelay();
      toast.success('Действие блокировки пока в режиме демонстрации');
      logEvent({
        type: 'admin.users.block-demo',
        timestamp: Date.now(),
        payload: { userId: user.id },
      });
      onCompleted?.();
    } catch (error) {
      console.error('❌ UserActions: ошибка блокировки', error);
      toast.error('Не удалось обновить статус пользователя');
    } finally {
      setIsBlocking(false);
    }
  }, [isSelf, onCompleted, user.id]);

  const handleRoleChange = useCallback(async () => {
    console.log('🔄 UserActions: изменение роли', { id: user.id });
    setIsUpdatingRole(true);

    try {
      await simulateNetworkDelay();
      toast.success('Изменение роли будет доступно после подключения API');
      logEvent({
        type: 'admin.users.role-demo',
        timestamp: Date.now(),
        payload: { userId: user.id },
      });
      onCompleted?.();
    } catch (error) {
      console.error('❌ UserActions: ошибка изменения роли', error);
      toast.error('Не удалось изменить роль пользователя');
    } finally {
      setIsUpdatingRole(false);
    }
  }, [onCompleted, user.id]);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <LoadingButton
        type="button"
        isLoading={isBlocking}
        onClick={handleBlockToggle}
        className="bg-white text-gray-700 hover:bg-gray-100"
      >
        {user.status === 'blocked' ? 'Разблокировать' : 'Заблокировать'}
      </LoadingButton>

      <LoadingButton
        type="button"
        isLoading={isUpdatingRole}
        onClick={handleRoleChange}
        className="bg-white text-gray-700 hover:bg-gray-100"
      >
        Изменить роль
      </LoadingButton>

      <Link
        href={`mailto:${user.email ?? ''}`}
        className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
      >
        Связаться
      </Link>
    </div>
  );
}

export type { UserActionsProps };
