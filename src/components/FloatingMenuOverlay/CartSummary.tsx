'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  useCartStore,
  selectCartItemCount,
  selectCartItems,
  selectCartTotal,
} from '@/store/useCartStore';
import { formatPrice } from '@/utils/formatPrice';
import { CartIcon, ChevronIcon } from '../shared/icons';

interface CartSummaryProps {
  onNavigate?: () => void;
}

const CartSummary = ({ onNavigate }: CartSummaryProps) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const itemCount = useCartStore(selectCartItemCount);
  const totalPriceInCents = useCartStore(selectCartTotal);
  const items = useCartStore(selectCartItems);

  const formattedTotal = formatPrice(totalPriceInCents);

  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 transition-colors">
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
            <span>
              {formattedTotal ? `${formattedTotal.value} ${formattedTotal.currency}` : '0 RUB'}
            </span>
          </div>
          <ChevronIcon
            isOpen={isCartOpen}
            direction="right"
            className="h-5 w-5 text-gray-400"
          />
        </div>
      </button>

      {isCartOpen && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
          {items.length === 0 ? (
            <p className="text-sm text-gray-500">Ваша корзина пуста.</p>
          ) : (
            <>
              <ul className="space-y-3">
                {items.slice(0, 3).map((item) => {
                  const previewPrice = formatPrice(item.price * item.quantity);
                  return (
                    <li key={item.productSizeId} className="flex items-center gap-3">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          width={56}
                          height={56}
                          className="h-14 w-14 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-md bg-gray-200 text-sm font-semibold text-gray-500">
                          {item.size}
                        </div>
                      )}
                      <div className="flex flex-1 flex-col text-left">
                        <span className="font-medium text-sm text-gray-800">
                          {item.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {item.size}
                          {item.color ? ` · ${item.color}` : ''} · {item.quantity} шт.
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-800">
                        {previewPrice
                          ? `${previewPrice.value} ${previewPrice.currency}`
                          : ''}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {items.length > 3 && (
                <p className="mt-3 text-xs text-gray-500">
                  И ещё {items.length - 3} позиций в корзине
                </p>
              )}

              <div className="mt-4 grid gap-2">
                <Link
                  href="/cart"
                  onClick={handleNavigate}
                  className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm ring-1 ring-inset ring-gray-200 transition hover:bg-gray-100"
                >
                  Перейти в корзину
                </Link>
                <Link
                  href="/checkout"
                  onClick={handleNavigate}
                  className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Оформить заказ
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CartSummary;
