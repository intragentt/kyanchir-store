// Местоположение: src/types/next-auth.d.ts

import 'next-auth';
import 'next-auth/jwt';
import { UserRole } from '@prisma/client'; // UserRole теперь - это МОДЕЛЬ, а не enum

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole; // <-- Теперь это ОБЪЕКТ { id: string, name: string }
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role: UserRole; // <-- User из базы данных тоже содержит ОБЪЕКТ role
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole; // <-- Токен тоже будет хранить ОБЪЕКТ role
  }
}
