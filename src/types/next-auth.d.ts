// Местоположение: src/types/next-auth.d.ts

import 'next-auth';
import 'next-auth/jwt';

// Расширяем стандартные типы NextAuth

declare module 'next-auth' {
  /**
   * Возвращается хуками вроде `useSession` или `getServerSession`
   */
  interface Session {
    user: {
      /** Стандартные поля */
      name?: string | null;
      email?: string | null;
      image?: string | null;
      /** Наше кастомное поле */
      id: string;
    };
  }

  /**
   * Модель User, как она приходит из authorize или адаптера
   */
  interface User {
    id: string;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Возвращается, когда мы используем JWT-стратегию
   */
  interface JWT {
    /** Наше кастомное поле в токене */
    id: string;
  }
}
