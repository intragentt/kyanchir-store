// Местоположение: src/components/ClientInteractivity.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import FloatingLogoButton from './FloatingLogoButton';
import FloatingMenuOverlay from './FloatingMenuOverlay';

export default function ClientInteractivity() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const scrollYRef = useRef(0);

  useEffect(() => {
    if (isMenuOpen) {
      scrollYRef.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollYRef.current}px`;
    } else {
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      window.scrollTo(0, scrollYRef.current);
    }

    return () => {
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <FloatingLogoButton onClick={toggleMenu} isMenuOpen={isMenuOpen} />

      {isMenuOpen && (
        <button
          onClick={toggleMenu}
          className="// --- ИСПРАВЛЕНО: Оставляем только один, правильный размер --- animate-in fade-in zoom-in-75 fixed right-[calc(7rem+env(safe-area-inset-right))] bottom-[calc(6rem+env(safe-area-inset-bottom))] z-[110] flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#E6E7EE] bg-white/70 backdrop-blur-sm duration-300"
          aria-label="Закрыть меню"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-800" // Этот размер верный
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}

      <FloatingMenuOverlay isOpen={isMenuOpen} onClose={toggleMenu} />
    </>
  );
}
