// Местоположение: src/app/api/auth/[...nextauth]/route.ts

import NextAuth from 'next-auth';
// --- НАЧАЛО ИЗМЕНЕНИЙ ---
// 1. Импортируем нашу единую конфигурацию из нового файла.
import { authOptions } from '@/lib/auth';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

// 2. Создаем обработчик, передавая ему нашу конфигурацию.
const handler = NextAuth(authOptions);

// 3. Экспортируем обработчик, как того требует Next.js.
export { handler as GET, handler as POST };
