import 'server-only';

import { randomUUID } from 'crypto';
import {
  getYookassaRuntimeConfig,
  resetYookassaRuntimeCache,
  YookassaRuntimeConfig,
} from '@/lib/settings/yookassa';

interface MoneyAmount {
  value: string;
  currency: string;
}

interface YookassaPaymentResponse {
  id: string;
  status: string;
  test?: boolean;
  amount: MoneyAmount;
  confirmation?: {
    confirmation_url?: string;
    type: string;
  };
  paid?: boolean;
}

export interface CheckoutItemForPayment {
  productName: string;
  productSizeValue: string;
  productColor: string | null;
  quantity: number;
  unitPrice: number; // value in cents
}

interface CreatePaymentParams {
  orderId: string;
  orderNumber: string;
  totalAmount: number; // value in cents
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingCity: string;
  shippingAddress: string;
  items: CheckoutItemForPayment[];
}

export interface YookassaPaymentSummary {
  id: string;
  status: string;
  confirmationUrl?: string;
  amount: MoneyAmount;
  isTest: boolean;
}

const formatAmount = (amountInCents: number): string => {
  return (amountInCents / 100).toFixed(2);
};

const composeItemDescription = (item: CheckoutItemForPayment): string => {
  const parts = [item.productName];

  if (item.productColor) {
    parts.push(item.productColor);
  }

  if (item.productSizeValue) {
    parts.push(`Размер ${item.productSizeValue}`);
  }

  const description = parts.join(', ');

  return description.length <= 128 ? description : `${description.slice(0, 125)}...`;
};

const sanitizePhone = (phone: string): string => {
  if (!phone) {
    return phone;
  }

  const digits = phone.replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('8')) {
    return `+7${digits.slice(1)}`;
  }

  if (digits.length === 11 && digits.startsWith('7')) {
    return `+${digits}`;
  }

  if (phone.startsWith('+')) {
    return `+${digits}`;
  }

  return phone;
};

const buildReceipt = (
  params: CreatePaymentParams,
  config: YookassaRuntimeConfig,
) => {
  if (!config.receiptEnabled) {
    return undefined;
  }

  return {
    customer: {
      email: params.customerEmail,
      phone: sanitizePhone(params.customerPhone),
      full_name: params.customerName,
    },
    items: params.items.map((item) => ({
      description: composeItemDescription(item),
      quantity: item.quantity,
      amount: {
        value: formatAmount(item.unitPrice * item.quantity),
        currency: 'RUB',
      },
      vat_code: config.vatCode ?? 1,
      payment_mode: 'full_prepayment',
      payment_subject: 'commodity',
      supplier: {
        name: config.merchantFullName,
        inn: config.merchantInn,
      },
    })),
    tax_system_code: config.taxSystemCode,
  };
};

const encodeAuthHeader = (shopId: string, secretKey: string): string => {
  const token = Buffer.from(`${shopId}:${secretKey}`).toString('base64');
  return `Basic ${token}`;
};

export const isYookassaConfigured = async (): Promise<boolean> => {
  const config = await getYookassaRuntimeConfig();
  return config !== null;
};

export async function createYookassaPayment(
  params: CreatePaymentParams,
): Promise<YookassaPaymentSummary | null> {
  const config = await getYookassaRuntimeConfig();

  if (!config) {
    return null;
  }

  const payload = {
    amount: {
      value: formatAmount(params.totalAmount),
      currency: 'RUB',
    },
    capture: true,
    description: `Заказ ${params.orderNumber} в Kyanchir Store`,
    confirmation: {
      type: 'redirect',
      return_url: config.returnUrl,
    },
    metadata: {
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      shippingCity: params.shippingCity,
      shippingAddress: params.shippingAddress,
      merchantInn: config.merchantInn,
      merchantName: config.merchantFullName,
    },
    receipt: buildReceipt(params, config),
    merchant_customer_id: params.customerEmail,
  };

  const response = await fetch('https://api.yookassa.ru/v3/payments', {
    method: 'POST',
    headers: {
      Authorization: encodeAuthHeader(config.shopId, config.secretKey),
      'Content-Type': 'application/json',
      'Idempotence-Key': randomUUID(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(
      `YooKassa responded with ${response.status}: ${response.statusText}. ${errorText}`,
    );
  }

  const data = (await response.json()) as YookassaPaymentResponse;

  return {
    id: data.id,
    status: data.status,
    confirmationUrl: data.confirmation?.confirmation_url,
    amount: data.amount,
    isTest: Boolean(data.test) || config.mode === 'test',
  };
}

export const resetYookassaConfigCache = () => {
  resetYookassaRuntimeCache();
};
