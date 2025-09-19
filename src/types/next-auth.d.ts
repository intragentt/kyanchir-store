// Местоположение: src/types/next-auth.d.ts

import 'next-auth';
import 'next-auth/jwt';
import { UserRole } from '@prisma/client';

// --- НАЧАЛО ИЗМЕНЕНИЙ: Расширяем все интерфейсы, добавляя bonusPoints ---
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      bonusPoints?: number; // <-- Добавляем сюда
    };
  }

  interface User {
    role: UserRole;
    bonusPoints?: number; // <-- И сюда
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    bonusPoints?: number; // <-- И в токен
  }
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---
