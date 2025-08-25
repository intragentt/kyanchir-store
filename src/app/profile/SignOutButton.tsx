// Местоположение: src/app/profile/SignOutButton.tsx
'use client';

async function handleSignOut() {
  try {
    const response = await fetch('/api/auth/logout', { method: 'POST' });
    if (response.ok) {
      // Полная перезагрузка страницы для редиректа на главную.
      // Это самый надежный способ обеспечить обновление состояния на сервере.
      window.location.href = '/';
    } else {
      console.error('Logout failed');
    }
  } catch (error) {
    console.error('Error during sign out:', error);
  }
}

export default function SignOutButton() {
  return (
    <button
      onClick={handleSignOut}
      className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
    >
      Выйти
    </button>
  );
}
