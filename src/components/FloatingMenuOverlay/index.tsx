'use client';

import React from 'react';
import { useAppStore } from '@/store/useAppStore';

// Импортируем все наши новые модули
import MenuHeader from './MenuHeader';
import AuthenticatedView from './AuthenticatedView';
import GuestView from './GuestView';
import DeliveryStatus from './DeliveryStatus';
import CartSummary from './CartSummary';
import MenuButton from './MenuButton';
import ShopNavigation from './ShopNavigation';
import InfoLinks from './InfoLinks';
import MenuFooter from './MenuFooter';

// Импортируем иконки, которые понадобятся для кнопок
import HeartIcon from '../icons/HeartIcon';
import ReceiptIcon from '../icons/ReceiptIcon';

interface FloatingMenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FloatingMenuOverlay({
  isOpen,
  onClose,
}: FloatingMenuOverlayProps) {
  const user = useAppStore((state) => state.user);
  const isAuthenticated = !!user;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-white transition-opacity duration-300 ease-in-out ${
        isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <MenuHeader onClose={onClose} />

      <div className="flex flex-grow flex-col overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex-grow">
          {isAuthenticated && user ? (
            <AuthenticatedView user={user} onClose={onClose} />
          ) : (
            <GuestView onClose={onClose} />
          )}

          <DeliveryStatus />

          <MenuButton
            href="/favorites"
            onClick={onClose}
            label="Избранное"
            icon={<HeartIcon className="h-6 w-6 flex-none text-gray-800" />}
            className="mt-6"
          />

          <CartSummary />

          <MenuButton
            href="/orders"
            onClick={onClose}
            label="История заказов"
            icon={<ReceiptIcon className="h-6 w-6 flex-none text-gray-800" />}
            className="mt-10"
          />

          <ShopNavigation />

          <InfoLinks />
        </div>

        <MenuFooter />
      </div>
    </div>
  );
}
