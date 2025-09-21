'use client';

import { useState, useTransition } from 'react';
import type { User } from '@prisma/client';
import { useRouter } from 'next/navigation';

import { updateUserProfile, updateUserPassword } from './actions';
import ProfileHeader from '@/components/profile/ProfileHeader';
import EditProfileForm from '@/components/profile/EditProfileForm';
import EditPasswordForm from '@/components/profile/EditPasswordForm';
import SignOutButton from './SignOutButton';
import ProfileInfoBlock from '@/components/profile/ProfileInfoBlock';

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
    /* ... */
  };
  const handleUpdatePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    /* ... */
  };
  const handleSendVerificationEmail = async () => {
    /* ... */
  };

  const handleEditPhone = () =>
    alert('Функционал редактирования телефона в разработке.');
  const handleEditAddress = () =>
    alert('Функционал редактирования адреса в разработке.');
  const handleSupport = () => router.push('/support');
  const handleLinkTelegram = () =>
    alert('Функционал привязки Telegram в разработке.');

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Заглушка для нового блока ---
  const handleManageSessions = () =>
    alert('Функционал управления сессиями в разработке.');
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  const handleDeleteAccount = () => {
    if (
      confirm(
        'Вы уверены, что хотите удалить свой аккаунт? Это действие необратимо.',
      )
    ) {
      alert('Функционал удаления аккаунта в разработке.');
    }
  };

  return (
    // --- НАЧАЛО ИЗМЕНЕНИЙ: Убран верхний отступ pt-4 ---
    <div className="mx-auto max-w-2xl space-y-6 px-4 pb-8">
      {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
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

      <ProfileInfoBlock
        title="Telegram"
        buttonText="Привязать"
        onButtonClick={handleLinkTelegram}
      >
        <p>Получайте уведомления о заказах</p>
      </ProfileInfoBlock>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <EditPasswordForm onSave={handleUpdatePassword} isPending={isPending} />
      </div>

      {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем новый блок Сессий --- */}
      <ProfileInfoBlock
        title="Активные сессии"
        buttonText="Управлять"
        onButtonClick={handleManageSessions}
      >
        <p>Просмотр и управление устройствами</p>
      </ProfileInfoBlock>
      {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}

      <ProfileInfoBlock
        title="Номер телефона"
        buttonText="Изменить"
        onButtonClick={handleEditPhone}
      >
        <p>Не указан</p>
      </ProfileInfoBlock>

      <ProfileInfoBlock
        title="Адрес доставки"
        buttonText="Изменить"
        onButtonClick={handleEditAddress}
      >
        <p>Не указан</p>
      </ProfileInfoBlock>

      <ProfileInfoBlock
        title="Поддержка"
        buttonText="Перейти"
        onButtonClick={handleSupport}
      >
        <p>Связаться с нами</p>
      </ProfileInfoBlock>

      <div className="mt-6">
        <SignOutButton />
      </div>

      <div className="pt-4 text-center">
        <button
          onClick={handleDeleteAccount}
          className="text-sm font-medium text-red-600 transition-colors hover:text-red-500"
        >
          Удалить аккаунт
        </button>
      </div>
    </div>
  );
}
