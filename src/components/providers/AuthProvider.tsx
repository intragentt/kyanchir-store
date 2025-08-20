// Местоположение: src/components/providers/AuthProvider.tsx
'use client'; // <-- Этот "Агент" работает только на стороне клиента

import { SessionProvider } from 'next-auth/react';

// Это простая "обертка", которая позволяет нам использовать SessionProvider
// (который является клиентским компонентом) внутри нашего серверного layout.tsx.
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
