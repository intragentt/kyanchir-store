'use client';

import React from 'react';

interface ProfileInfoBlockProps {
  title: string;
  children: React.ReactNode;
  buttonText: string;
  onButtonClick: () => void;
  isDestructive?: boolean; // Для кнопок типа "Удалить"
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

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-body font-semibold text-gray-500">{title}</div>
          <div className="font-body text-lg text-gray-900">{children}</div>
        </div>
        <button
          onClick={onButtonClick}
          className={`font-body text-sm font-semibold ${buttonColorClass}`}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default ProfileInfoBlock;
