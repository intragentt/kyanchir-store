// --- НАЧАЛО ИЗМЕНЕНИЙ: Ставим "печать" ---
// Эта строка - приказ для сборщика Next.js.
// Она говорит: "Если ты попробуешь включить этот файл в клиентский код -
// немедленно останови сборку с ошибкой".
// Это гарантирует, что наши секреты никогда не утекут на клиент.
import 'server-only';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const ivLength = 16;

let cachedKey: Buffer | null = null;
let cachedSalt: string | null = null;

function ensureKey(): Buffer {
  if (cachedKey) {
    return cachedKey;
  }

  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      'Критическая ошибка: ENCRYPTION_KEY не определен или имеет неверную длину. Требуется 64-символьная hex-строка.',
    );
  }

  cachedKey = Buffer.from(keyHex, 'hex');
  return cachedKey;
}

function ensureSalt(): string {
  if (cachedSalt) {
    return cachedSalt;
  }

  const saltFromEnv = process.env.ENCRYPTION_SALT;
  if (!saltFromEnv) {
    throw new Error(
      'Критическая ошибка: ENCRYPTION_SALT не определен в .env файле.',
    );
  }

  cachedSalt = saltFromEnv;
  return cachedSalt;
}

export function encrypt(text: string): string {
  const key = ensureKey();
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  const key = ensureKey();
  const parts = text.split(':');
  if (parts.length !== 2) {
    throw new Error('Неверный формат зашифрованных данных.');
  }
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = Buffer.from(parts[1], 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([
    decipher.update(encryptedText),
    decipher.final(),
  ]);
  return decrypted.toString();
}

export function createHash(text: string): string {
  const salt = ensureSalt();
  return crypto.createHmac('sha256', salt).update(text).digest('hex');
}
