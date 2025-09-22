'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
// --- НАЧАЛО ИЗМЕНЕНИЙ: Исправляем синтаксис импорта на именованный ---
import { CheckIcon } from './icons/CheckIcon';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('cookie_consent_given') !== 'true') {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent_given', 'true');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="animate-in slide-in-from-bottom-10 fixed bottom-4 left-4 right-4 z-[200] rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <p className="flex-grow text-center text-sm font-medium text-gray-800 sm:text-left">
          Мы используем{' '}
          <Link href="/privacy-policy" className="underline hover:text-black">
            куки
          </Link>
          , чтобы сайт работал корректно и был удобен для вас.
        </p>
        <button
          onClick={handleAccept}
          className="flex h-12 w-full flex-shrink-0 items-center justify-between rounded-xl border border-gray-800 px-6 transition-colors hover:bg-gray-800/10 sm:w-auto"
        >
          <span className="font-semibold text-gray-800">Хорошо</span>
          <CheckIcon className="ml-4 h-6 w-6 text-gray-800" />
        </button>
      </div>
    </div>
  );
}
