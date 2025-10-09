'use client';

import React, { useEffect, useRef, useState } from 'react'; // <-- Добавлены клиентские хуки
import { useAppStore } from '@/store/useAppStore';

import MenuHeader from './MenuHeader';
import AuthenticatedView from './AuthenticatedView';
import GuestView from './GuestView';
import DeliveryStatus from './DeliveryStatus';
import CartSummary from './CartSummary';
import MenuButton from './MenuButton';
import ShopNavigation from './ShopNavigation';
import InfoLinks from './InfoLinks';
import MenuFooter from './MenuFooter';
import { HeartIcon, ReceiptIcon } from '../shared/icons';
import VerificationModal from '../shared/modals/VerificationModal'; // <-- ШАГ 1: Импортируем модальное окно

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

  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = overlayRef.current;
    if (!node) {
      return;
    }

    if (isOpen) {
      node.removeAttribute('inert');
    } else {
      node.setAttribute('inert', '');
    }
  }, [isOpen]);

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Управление состоянием модального окна ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openVerificationModal = () => setIsModalOpen(true);
  const closeVerificationModal = () => setIsModalOpen(false);
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  return (
    <>
      {' '}
      {/* Используем фрагмент, чтобы вернуть два корневых элемента */}
      <div
        ref={overlayRef}
        id="floating-menu-overlay"
        className={`fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-white transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={isOpen ? undefined : true}
        role="dialog"
        aria-modal="true"
      >
        <MenuHeader onClose={onClose} />

        <div className="flex flex-grow flex-col overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex-grow">
            {isAuthenticated && user ? (
              // Передаем функцию для открытия модального окна
              <AuthenticatedView
                user={user}
                onClose={onClose}
                onVerifyClick={openVerificationModal}
              />
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

            <CartSummary onNavigate={onClose} />

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
      {/* Рендерим модальное окно здесь, чтобы оно было поверх всего */}
      <VerificationModal
        isOpen={isModalOpen}
        onClose={closeVerificationModal}
        email={user?.email}
      />
    </>
  );
}
