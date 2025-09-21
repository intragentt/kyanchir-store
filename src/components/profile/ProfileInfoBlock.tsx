'use client';

import React from 'react';
import SettingsIcon from '../icons/SettingsIcon'; // <-- Импортируем иконку

interface ProfileInfoBlockProps {
  title: string;
  children: React.ReactNode;
  buttonText: string;
  onButtonClick: () => void;
  isDestructive?: boolean;
}

const ProfileInfoBlock = ({
  title,
  children,
  buttonText,
  onButtonClick,
  isDestructive = false,
}: ProfileInfoBlockProps) => {
  const buttonColorClass = isDestructive
    ? 'text-red-600 hover:text-red-500'
    : 'text-indigo-600 hover:text-indigo-500';

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Умная кнопка (иконка или текст) ---
  const isIconButton = ['Изменить', 'Привязать'].includes(buttonText);
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-body font-semibold text-gray-500">{title}</div>
          <div className="font-body text-lg text-gray-900">{children}</div>
        </div>

        {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Условный рендеринг кнопки --- */}
        {isIconButton ? (
          <button
            onClick={onButtonClick}
            className="p-2 text-gray-600 transition-colors hover:text-gray-900"
            aria-label={buttonText}
          >
            <SettingsIcon className="h-6 w-6" />
          </button>
        ) : (
          <button
            onClick={onButtonClick}
            className={`font-body text-sm font-semibold ${buttonColorClass}`}
          >
            {buttonText}
          </button>
        )}
        {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
      </div>
    </div>
  );
};

export default ProfileInfoBlock;
