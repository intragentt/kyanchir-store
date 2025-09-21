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
  const handleManageSessions = () =>
    alert('Функционал управления сессиями в разработке.');

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
    // --- НАЧАЛО ИЗМЕНЕНИЙ: Уменьшаем боковые отступы px-4 -> px-2 ---
    <div className="mx-auto max-w-2xl space-y-0 px-2 pb-8 pt-6">
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

      <div className="border-b border-gray-200 py-5">
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

      <div className="border-b border-gray-200 py-5">
        <EditPasswordForm onSave={handleUpdatePassword} isPending={isPending} />
      </div>

      <ProfileInfoBlock
        title="Активные сессии"
        buttonText="Управлять"
        onButtonClick={handleManageSessions}
      >
        <p>Просмотр и управление устройствами</p>
      </ProfileInfoBlock>

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

      <div className="pt-8">
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
