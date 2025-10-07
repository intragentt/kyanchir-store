import 'server-only';

import { randomUUID } from 'crypto';

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

interface InternalYookassaConfig {
  mode: 'test' | 'live';
  shopId: string;
  secretKey: string;
  merchantInn: string;
  merchantFullName: string;
  returnUrl: string;
  receiptEnabled: boolean;
  taxSystemCode?: number;
  vatCode?: number;
}

let cachedConfig: InternalYookassaConfig | null | undefined;

const DEFAULT_RETURN_URL = process.env.YOOKASSA_RETURN_URL ??
  (process.env.NEXTAUTH_URL
    ? `${process.env.NEXTAUTH_URL.replace(/\/$/, '')}/checkout/success`
    : 'https://kyanchir.ru/checkout/success');

const DEFAULT_MERCHANT_INN = process.env.YOOKASSA_MERCHANT_INN ?? '503125980428';
const DEFAULT_MERCHANT_FULL_NAME =
  process.env.YOOKASSA_MERCHANT_FULL_NAME ??
  'ИНДИВИДУАЛЬНЫЙ ПРЕДПРИНИМАТЕЛЬ КОЛЕСНИКОВА ЯНА РУСЛАНОВНА';

const DEFAULT_MODE = (process.env.YOOKASSA_MODE ?? 'test').toLowerCase() === 'live' ? 'live' : 'test';

const resolveConfig = (): InternalYookassaConfig | null => {
  if (cachedConfig !== undefined) {
    return cachedConfig;
  }

  const mode = DEFAULT_MODE;
  const primaryShopId = process.env.YOOKASSA_SHOP_ID;
  const primarySecretKey = process.env.YOOKASSA_SECRET_KEY;
  const testShopId = process.env.YOOKASSA_TEST_SHOP_ID;
  const testSecretKey = process.env.YOOKASSA_TEST_SECRET_KEY;

  const shopId = mode === 'live' ? primaryShopId : testShopId ?? primaryShopId;
  const secretKey = mode === 'live' ? primarySecretKey : testSecretKey ?? primarySecretKey;

  if (!shopId || !secretKey) {
    cachedConfig = null;
    return null;
  }

  const receiptEnabled = (process.env.YOOKASSA_RECEIPT_ENABLED ?? 'true').toLowerCase() !== 'false';

  const taxSystemCodeRaw = process.env.YOOKASSA_TAX_SYSTEM_CODE;
  const vatCodeRaw = process.env.YOOKASSA_RECEIPT_VAT_CODE;

  const taxSystemCode = taxSystemCodeRaw ? Number.parseInt(taxSystemCodeRaw, 10) : undefined;
  const vatCode = vatCodeRaw ? Number.parseInt(vatCodeRaw, 10) : undefined;

  cachedConfig = {
    mode,
    shopId,
    secretKey,
    merchantInn: DEFAULT_MERCHANT_INN,
    merchantFullName: DEFAULT_MERCHANT_FULL_NAME,
    returnUrl: DEFAULT_RETURN_URL,
    receiptEnabled,
    taxSystemCode: Number.isNaN(taxSystemCode) ? undefined : taxSystemCode,
    vatCode: Number.isNaN(vatCode) ? undefined : vatCode,
  };

  return cachedConfig;
};

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
  config: InternalYookassaConfig,
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

export const isYookassaConfigured = (): boolean => {
  return resolveConfig() !== null;
};

export async function createYookassaPayment(
  params: CreatePaymentParams,
): Promise<YookassaPaymentSummary | null> {
  const config = resolveConfig();

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
  cachedConfig = undefined;
};
