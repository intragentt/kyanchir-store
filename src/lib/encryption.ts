import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const ivLength = 16;

const keyHex = process.env.ENCRYPTION_KEY;
if (!keyHex || keyHex.length !== 64) {
  throw new Error(
    'Критическая ошибка: ENCRYPTION_KEY не определен или имеет неверную длину. Требуется 64-символьная hex-строка.',
  );
}
const key = Buffer.from(keyHex, 'hex');

// Эта проверка гарантирует, что соль существует при запуске приложения
const saltFromEnv = process.env.ENCRYPTION_SALT;
if (!saltFromEnv) {
  throw new Error(
    'Критическая ошибка: ENCRYPTION_SALT не определен в .env файле.',
  );
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
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
  // --- НАЧАЛО ИЗМЕНЕНИЙ: Добавляем проверку внутри функции для TypeScript ---
  const salt = process.env.ENCRYPTION_SALT;
  if (!salt) {
    // Эта ошибка никогда не должна сработать, если проверка выше на месте,
    // но она заставляет TypeScript быть уверенным, что salt - это string.
    throw new Error('Критическая ошибка: ENCRYPTION_SALT не доступен в createHash.');
  }
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---
  return crypto.createHmac('sha256', salt).update(text).digest('hex');
}