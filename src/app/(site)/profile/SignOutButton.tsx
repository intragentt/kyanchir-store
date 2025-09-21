// Местоположение: src/app/profile/SignOutButton.tsx
'use client';

// --- НАЧАЛО ИЗМЕНЕНИЙ ---
// Импортируем официальную функцию signOut
import { signOut } from 'next-auth/react';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

export default function SignOutButton() {
  return (
    <button
      // --- НАЧАЛО ИЗМЕНЕНИЙ ---
      // При нажатии вызываем signOut и указываем, куда перенаправить пользователя после выхода
      onClick={() => signOut({ callbackUrl: '/' })}
      // --- КОНЕЦ ИЗМЕНЕНИЙ ---
      className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
    >
      Выйти
    </button>
  );
}
