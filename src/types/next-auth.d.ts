// Местоположение: src/types/next-auth.d.ts

import 'next-auth';
import 'next-auth/jwt';
import { UserRole } from '@prisma/client'; // <-- Импортируем наш Enum

// Расширяем стандартные типы NextAuth

declare module 'next-auth' {
  /**
   * Возвращается хуками вроде `useSession` или `getServerSession`
   */
  interface Session {
    user?: {
      id: string;
      role: UserRole; // <-- НАШЕ НОВОЕ ПОЛЕ
    } & {
      // <-- Объединяем со стандартными полями
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  /**
   * Модель User, как она приходит из authorize или адаптера
   */
  interface User {
    id: string;
    role: UserRole; // <-- НАШЕ НОВОЕ ПОЛЕ
  }
}

declare module 'next-auth/jwt' {
  /**
   * Возвращается, когда мы используем JWT-стратегию
   */
  interface JWT {
    id: string;
    role: UserRole; // <-- НАШЕ НОВОЕ ПОЛЕ
  }
}
