'use client';

import React from 'react';
import Link from 'next/link';

interface MenuButtonProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  onClick?: () => void;
  className?: string;
}

const MenuButton = ({
  icon,
  label,
  href,
  onClick,
  className = '',
}: MenuButtonProps) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex cursor-pointer items-center space-x-3 rounded-lg border border-gray-200 p-4 transition-colors ${className}`}
    >
      {icon}
      <div className="font-body text-base font-semibold text-gray-800 md:text-lg">
        {label}
      </div>
    </Link>
  );
};

export default MenuButton;
