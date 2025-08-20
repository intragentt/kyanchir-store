// Местоположение: src/lib/session.ts
// Метафора: Наша "Шифровальная Машина" для пропусков (сессий).

import { SignJWT, jwtVerify } from 'jose';

// Получаем "секретный ключ" для шифрования из нашего .env файла.
const secretKey = process.env.AUTH_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

// Функция для "шифрования" данных пользователя в "пропуск" (JWT).
export async function encrypt(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d') // Срок годности "пропуска" - 30 дней
    .sign(encodedKey);
}

// Функция для "расшифровки" и проверки "пропуска".
export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    console.log('Failed to verify session');
    return null;
  }
}
