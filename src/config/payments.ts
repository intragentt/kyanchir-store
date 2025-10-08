// src/config/payments.ts
// Центральная конфигурация тестовых платежей.

const explicitToggle = process.env.NEXT_PUBLIC_ENABLE_TEST_PAYMENT_REDIRECT;

export const TEST_PAYMENT_URL = process.env.NEXT_PUBLIC_TEST_PAYMENT_URL ?? null;

export const TEST_PAYMENT_KEY = process.env.NEXT_PUBLIC_TEST_PAYMENT_KEY ?? null;

export const IS_TEST_PAYMENT_REDIRECT_ENABLED =
  Boolean(TEST_PAYMENT_URL) && explicitToggle?.toLowerCase() !== 'false';

export const TEST_PAYMENT_BUTTON_LABEL =
  process.env.NEXT_PUBLIC_TEST_PAYMENT_BUTTON_LABEL ?? 'Оплатить (тест)';
