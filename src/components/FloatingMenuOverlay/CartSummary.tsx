'use client';

import React, { useState } from 'react';
import { CartIcon, ChevronIcon } from '../shared/icons';

const CartSummary = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Статические данные, как в оригинальном компоненте
  const itemCount = 3;
  const totalPrice = '7 497 RUB';

  return (
    <div className="mt-6 rounded-lg border border-gray-200 transition-colors">
      <button
        onClick={() => setIsCartOpen(!isCartOpen)}
        className="flex w-full items-center justify-between p-4"
      >
        <div className="flex items-center space-x-3">
          <CartIcon className="h-6 w-6 flex-none text-gray-800" />
          <div className="font-body text-base font-semibold text-gray-800 md:text-lg">
            Корзина
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>{itemCount}</span>
            <span className="text-gray-300">·</span>
            <span>{totalPrice}</span>
          </div>
          <ChevronIcon
            isOpen={isCartOpen}
            direction="right"
            className="h-5 w-5 text-gray-400"
          />
        </div>
      </button>
    </div>
  );
};

export default CartSummary;
