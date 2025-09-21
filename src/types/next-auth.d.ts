import 'next-auth';
import 'next-auth/jwt';
import { UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      bonusPoints?: number;
      emailVerified?: Date | null; // <-- ДОБАВЛЕНО
    };
  }

  interface User {
    role: UserRole;
    bonusPoints?: number;
    emailVerified?: Date | null; // <-- ДОБАВЛЕНО
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    bonusPoints?: number;
    emailVerified?: Date | null; // <-- ДОБАВЛЕНО
  }
}
