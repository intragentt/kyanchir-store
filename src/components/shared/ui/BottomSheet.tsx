// Местоположение: src/components/ui/BottomSheet.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { CloseIcon } from '@/components/shared/icons';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const scrollYRef = useRef(0);
  const [translateY, setTranslateY] = useState('100%');
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTranslateY('0%');
      scrollYRef.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.overscrollBehaviorY = 'contain';
    } else {
      setTranslateY('100%');
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      document.body.style.overscrollBehaviorY = '';
      window.scrollTo(0, scrollYRef.current);
    }
    return () => {
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      document.body.style.overscrollBehaviorY = '';
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.targetTouches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.targetTouches[0].clientY;
    const deltaY = currentY - touchStartY.current;
    if (deltaY > 0) {
      const panelHeight = panelRef.current?.offsetHeight || window.innerHeight;
      const percentageDragged = (deltaY / panelHeight) * 100;
      setTranslateY(`${percentageDragged}%`);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const currentPercentage = parseFloat(translateY);
    const SWIPE_THRESHOLD_PERCENTAGE = 35;
    if (currentPercentage > SWIPE_THRESHOLD_PERCENTAGE) {
      onClose(); // Это вызовет закрытие шторки
    } else {
      setTranslateY('0%');
    }
  };

  if (!isOpen && translateY === '100%') return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-end bg-gradient-to-t from-[rgba(0,0,0,0.4)] to-[rgba(0,0,0,0.1)] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full rounded-t-lg bg-white pb-[env(safe-area-inset-bottom)] shadow-xl"
        style={{
          transform: `translateY(${translateY})`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          className="flex-none px-4 py-4"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          // --- ВОТ ГЛАВНОЕ ИЗМЕНЕНИЕ ---
          // Это свойство запрещает браузеру любые стандартные действия
          // (скролл, зум, перезагрузка) при касании этой области.
          style={{ touchAction: 'none' }}
        >
          <div className="absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-gray-300" />
          <div className="flex items-center justify-between">
            <div className="text-lg font-medium text-gray-900">{title}</div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <CloseIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
        <div className="flex-grow overflow-y-auto px-4 pb-4">{children}</div>
      </div>
    </div>
  );
}
