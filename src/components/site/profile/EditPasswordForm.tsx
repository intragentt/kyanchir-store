'use client';

import React, { useState } from 'react';

interface EditPasswordFormProps {
  // eslint-disable-next-line no-unused-vars
  onSave: (currentPassword: string, newPassword: string) => Promise<void>;
  isPending: boolean;
}

export default function EditPasswordForm({
  onSave,
  isPending,
}: EditPasswordFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState(''); // Локальная ошибка для этой формы

  const handleSave = async () => {
    if (!currentPassword || !newPassword) {
      setError('Оба поля должны быть заполнены.');
      return;
    }
    // Можно добавить более сложную валидацию
    if (newPassword.length < 8) {
      setError('Новый пароль должен содержать минимум 8 символов.');
      return;
    }
    setError('');
    await onSave(currentPassword, newPassword);
    // Сбрасываем поля и закрываем форму только в случае успеха (это будет в родительском компоненте)
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentPassword('');
    setNewPassword('');
    setError('');
  };

  if (!isEditing) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <div className="font-body font-semibold text-gray-500">Пароль</div>
          <div className="font-body text-lg">************</div>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="font-body text-sm font-semibold text-indigo-600 hover:text-indigo-500"
        >
          Изменить
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="font-body font-semibold text-gray-500">Смена пароля</div>
      <input
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        placeholder="Текущий пароль"
        className="block w-full rounded-md border-gray-300 font-body shadow-sm sm:text-sm"
      />
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="Новый пароль (мин. 8 символов)"
        className="block w-full rounded-md border-gray-300 font-body shadow-sm sm:text-sm"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-x-2">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="font-body text-sm font-semibold text-green-600 hover:text-green-500 disabled:opacity-50"
        >
          {isPending ? '...' : 'Сохранить'}
        </button>
        <button
          onClick={handleCancel}
          className="font-body text-sm text-gray-500 hover:text-gray-700"
        >
          Отмена
        </button>
      </div>
    </div>
  );
}
