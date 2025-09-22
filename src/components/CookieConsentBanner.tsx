'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckIcon } from './icons/CheckIcon';

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
    <div className="fixed bottom-4 left-4 right-4 z-[200] rounded-2xl border border-gray-200 bg-white p-4 shadow-lg animate-in slide-in-from-bottom-10">
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем перенос строки --- */}
        <p className="flex-grow text-center text-sm font-medium text-gray-800 sm:text-left">
          <span>
            <Link href="/privacy-policy" className="underline hover:text-black">
              Мы используем куки
            </Link>
            , чтобы улучшить
          </span>
          <span className="block">ваш опыт взаимодействия с сайтом.</span>
        </p>
        {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
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