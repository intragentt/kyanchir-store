'use client';

import { useState, useTransition } from 'react';
import type { User } from '@prisma/client';
import { useRouter } from 'next/navigation';

import { updateUserProfile, updateUserPassword } from './actions';
import ProfileHeader from '@/components/profile/ProfileHeader';
import EditProfileForm from '@/components/profile/EditProfileForm';
import EditPasswordForm from '@/components/profile/EditPasswordForm';
import SignOutButton from './SignOutButton';

interface ProfileClientProps {
  user: User & { role?: { name?: string | null } | null };
}

export default function ProfileClient({
  user: initialUser,
}: ProfileClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [user, setUser] = useState(initialUser);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(initialUser.name || '');
  const [surname, setSurname] = useState(initialUser.surname || '');

  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleUpdateProfile = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateUserProfile({ name, surname });
      if (result.error) {
        setError(result.error);
      } else if (result.success && result.data) {
        setSuccess('Профиль успешно обновлен!');
        setUser(
          result.data as User & { role?: { name: string | null } | null },
        );
        setIsEditingName(false);
        router.refresh();
      }
    });
  };

  const handleUpdatePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await updateUserPassword({ currentPassword, newPassword });
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        setSuccess('Пароль успешно изменен!');
      }
    });
  };

  const handleSendVerificationEmail = async () => {
    setIsSendingEmail(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/auth/send-verification-link', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || 'Не удалось отправить письмо.');
      setSuccess('Письмо с подтверждением отправлено на ваш email.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    // --- НАЧАЛО ИЗМЕНЕНИЙ: Упрощаем контейнер ---
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      {/* Уведомления */}
      {error && (
        <div className="rounded-md bg-red-100 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-100 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Блок Профиля: убрана обертка-карточка */}
      <div>
        {isEditingName ? (
          <EditProfileForm
            user={user}
            name={name}
            setName={setName}
            surname={surname}
            setSurname={setSurname}
            onSave={handleUpdateProfile}
            onCancel={() => setIsEditingName(false)}
            isPending={isPending}
          />
        ) : (
          <ProfileHeader
            user={user}
            onEditClick={() => setIsEditingName(true)}
            onSendVerificationEmail={handleSendVerificationEmail}
            isSendingEmail={isSendingEmail}
          />
        )}
      </div>

      {/* Блок Пароля: остался в виде карточки для визуального разделения */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <EditPasswordForm onSave={handleUpdatePassword} isPending={isPending} />
      </div>

      <div className="mt-6">
        <SignOutButton />
      </div>
    </div>
    // --- КОНЕЦ ИЗМЕНЕНИЙ ---
  );
}
