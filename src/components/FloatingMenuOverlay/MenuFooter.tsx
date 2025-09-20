'use client';

import React from 'react';

const MenuFooter = () => {
  return (
    <div className="mt-auto flex-shrink-0 border-t border-gray-200 pt-6">
      <div className="flex items-center justify-center space-x-6">
        <div className="cursor-pointer font-body text-sm font-medium text-gray-500 transition-colors hover:text-black">
          Политика
        </div>
        <div className="cursor-pointer font-body text-sm font-medium text-gray-500 transition-colors hover:text-black">
          Конфиденциальность
        </div>
      </div>
    </div>
  );
};

export default MenuFooter;