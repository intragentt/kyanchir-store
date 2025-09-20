'use client';

import React from 'react';
import Link from 'next/link';

interface GuestViewProps {
  onClose: () => void;
}

const GuestView = ({ onClose }: GuestViewProps) => {
  return (
    <Link
      href="/login"
      onClick={onClose}
      className="whitespace-nowrap font-body text-base font-semibold text-gray-800 md:text-lg"
    >
      Вход / Регистрация
    </Link>
  );
};

export default GuestView;
