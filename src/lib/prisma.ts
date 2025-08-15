// Местоположение: src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Эта конструкция (singleton) гарантирует, что в режиме разработки
// не создается новое соединение с базой данных при каждом hot-reload.
// Это лучшая практика для Next.js.

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
