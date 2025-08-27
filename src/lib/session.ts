// Местоположение: src/lib/session.ts
// Метафора: Наша "Шифровальная Машина" для пропусков (сессий).

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.AUTH_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(encodedKey);
}

export async function decrypt() {
  // --- НАЧАЛО ИЗМЕНЕНИЙ ---
  // Добавляем await и скобки
  const sessionCookie = (await cookies()).get('session')?.value;
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
  if (!sessionCookie) return null;

  try {
    const { payload } = await jwtVerify(sessionCookie, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    console.log('Failed to verify session');
    return null;
  }
}
