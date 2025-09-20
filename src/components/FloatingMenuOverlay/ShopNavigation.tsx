'use client';

import React from 'react';

const ShopNavigation = () => {
  return (
    <div className="mt-10 rounded-lg border border-gray-200 p-4">
      <div className="font-body text-base font-semibold text-gray-800 md:text-lg">
        Магазин
      </div>
      <div className="scrollbar-hide mt-4 flex items-center space-x-4 overflow-x-auto pb-2">
        <div className="flex-shrink-0 cursor-pointer whitespace-nowrap font-body text-base font-medium text-gray-600 transition-colors hover:text-black">
          Все товары
        </div>
        <div className="flex-shrink-0 cursor-pointer whitespace-nowrap font-body text-base font-medium text-gray-600 transition-colors hover:text-black">
          пижамы
        </div>
        <div className="flex-shrink-0 cursor-pointer whitespace-nowrap font-body text-base font-medium text-gray-600 transition-colors hover:text-black">
          нижнее белье
        </div>
        <div className="flex-shrink-0 cursor-pointer whitespace-nowrap font-body text-base font-medium text-gray-600 transition-colors hover:text-black">
          для дома
        </div>
        <div className="flex-shrink-0 cursor-pointer whitespace-nowrap font-body text-base font-medium text-gray-600 transition-colors hover:text-black">
          сертификаты
        </div>
      </div>
    </div>
  );
};

export default ShopNavigation;
