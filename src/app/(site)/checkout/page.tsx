'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  useCartStore,
  selectCartItems,
  selectCartItemCount,
  selectCartTotal,
} from '@/store/useCartStore';
import { useAppStore } from '@/store/useAppStore';
import { formatPrice } from '@/utils/formatPrice';
import { CheckIcon, XMarkIcon } from '@/components/shared/icons';

interface CheckoutFormState {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
}

interface CheckoutItemSummary {
  productSizeId: string;
  productName: string;
  productSizeValue: string;
  productColor: string | null;
  quantity: number;
  unitPrice: number;
}

interface CheckoutResult {
  orderNumber: string;
  totalAmount: number;
  items: CheckoutItemSummary[];
  customerEmail?: string;
  payment?: {
    id: string;
    status: string;
    confirmationUrl: string | null;
    isTest: boolean;
    amount: {
      value: string;
      currency: string;
    };
  };
  paymentError?: string;
}

const initialFormState: CheckoutFormState = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  shippingAddress: '',
  shippingCity: '',
  shippingPostalCode: '',
};

const buildSummaryItems = (
  orderResult: CheckoutResult | null,
  cartItems: ReturnType<typeof selectCartItems>,
): CheckoutItemSummary[] => {
  if (orderResult) {
    return orderResult.items;
  }

  return cartItems.map((item) => ({
    productSizeId: item.productSizeId,
    productName: item.name,
    productSizeValue: item.size,
    productColor: item.color ?? null,
    quantity: item.quantity,
    unitPrice: item.price,
  }));
};

export default function CheckoutPage() {
  const items = useCartStore(selectCartItems);
  const itemCount = useCartStore(selectCartItemCount);
  const totalAmount = useCartStore(selectCartTotal);
  const clearCart = useCartStore((state) => state.clearCart);
  const showNotification = useAppStore((state) => state.showNotification);

  const [formState, setFormState] = useState<CheckoutFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<CheckoutResult | null>(null);

  const summaryItems = useMemo(
    () => buildSummaryItems(orderResult, items),
    [items, orderResult],
  );

  const summaryTotal = orderResult ? orderResult.totalAmount : totalAmount;
  const formattedTotal = formatPrice(summaryTotal);
  const totalLabel = formattedTotal
    ? `${formattedTotal.value} ${formattedTotal.currency}`
    : '0 RUB';

  const hasItemsForCheckout = summaryItems.length > 0;

  const handleChange = (
    field: keyof CheckoutFormState,
    value: string,
  ) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormState(initialFormState);
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    if (!items.length) {
      setErrorMessage('Корзина пуста. Добавьте товары перед оформлением заказа.');
      showNotification('Корзина пуста', 'error', XMarkIcon);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formState,
          items: items.map((item) => ({
            productSizeId: item.productSizeId,
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload?.error ?? 'Не удалось оформить заказ. Попробуйте снова позже.';
        setErrorMessage(message);
        showNotification(message, 'error', XMarkIcon);
        return;
      }

      const result: CheckoutResult = await response.json();
      setOrderResult(result);
      clearCart();
      resetForm();
      showNotification('Заказ оформлен', 'success', CheckIcon);
    } catch (error) {
      console.error('Failed to submit order', error);
      const message = 'Произошла непредвиденная ошибка. Попробуйте снова позже.';
      setErrorMessage(message);
      showNotification(message, 'error', XMarkIcon);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasItemsForCheckout && !orderResult) {
    return (
      <section className="mx-auto flex max-w-3xl flex-col gap-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-gray-900">Корзина пуста</h1>
          <p className="text-base text-gray-500">
            Добавьте товары в корзину, чтобы перейти к оформлению заказа.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/catalog"
            className="inline-flex items-center justify-center rounded-md bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Перейти в каталог
          </Link>
          <Link
            href="/cart"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            Вернуться в корзину
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-gray-900">
          {orderResult ? 'Спасибо за заказ' : 'Оформление заказа'}
        </h1>
        <p className="text-sm text-gray-500">
          {orderResult
            ? 'Мы уже начинаем собирать посылку. Проверьте электронную почту и следуйте инструкции по оплате.'
            : 'Заполните данные получателя, и мы подготовим заказ к отправке.'}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-6">
          {orderResult ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Заказ оформлен</h2>
              <p className="mt-2 text-sm text-gray-500">
                Номер заказа: <span className="font-semibold text-gray-900">{orderResult.orderNumber}</span>
              </p>
              {orderResult.customerEmail && (
                <p className="text-sm text-gray-500">
                  Подтверждение отправлено на: {orderResult.customerEmail}
                </p>
              )}
              {orderResult.payment && (
                <div className="mt-4 space-y-3 rounded-md bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-gray-900">Оплата через ЮKassa</span>
                    <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      {orderResult.payment.status}
                      {orderResult.payment.isTest ? ' · ТЕСТ' : ''}
                    </span>
                  </div>
                  {orderResult.payment.amount && (
                    <p className="text-sm text-gray-600">
                      К оплате: {orderResult.payment.amount.value}{' '}
                      {orderResult.payment.amount.currency}
                    </p>
                  )}
                  {orderResult.payment.confirmationUrl ? (
                    <a
                      href={orderResult.payment.confirmationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                      Перейти к оплате
                    </a>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Ссылка на оплату будет отправлена дополнительно.
                    </p>
                  )}
                  {orderResult.payment.isTest && (
                    <p className="text-xs text-gray-500">
                      Сейчас используется тестовый магазин ЮKassa. После подключения боевого кабинета
                      платежи будут проходить в стандартном режиме.
                    </p>
                  )}
                </div>
              )}
              {orderResult.paymentError && (
                <p className="mt-3 text-sm font-medium text-rose-600">
                  {orderResult.paymentError}
                </p>
              )}
              <Link
                href="/catalog"
                className="mt-4 inline-flex items-center justify-center rounded-md bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Продолжить покупки
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="customerName" className="text-sm font-medium text-gray-700">
                    Имя и фамилия
                  </label>
                  <input
                    id="customerName"
                    name="customerName"
                    type="text"
                    autoComplete="name"
                    required
                    value={formState.customerName}
                    onChange={(event) => handleChange('customerName', event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="customerEmail" className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    autoComplete="email"
                    required
                    value={formState.customerEmail}
                    onChange={(event) => handleChange('customerEmail', event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="customerPhone" className="text-sm font-medium text-gray-700">
                    Телефон
                  </label>
                  <input
                    id="customerPhone"
                    name="customerPhone"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={formState.customerPhone}
                    onChange={(event) => handleChange('customerPhone', event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="shippingCity" className="text-sm font-medium text-gray-700">
                    Город
                  </label>
                  <input
                    id="shippingCity"
                    name="shippingCity"
                    type="text"
                    autoComplete="address-level2"
                    required
                    value={formState.shippingCity}
                    onChange={(event) => handleChange('shippingCity', event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="shippingAddress" className="text-sm font-medium text-gray-700">
                  Адрес доставки
                </label>
                <input
                  id="shippingAddress"
                  name="shippingAddress"
                  type="text"
                  autoComplete="street-address"
                  required
                  value={formState.shippingAddress}
                  onChange={(event) => handleChange('shippingAddress', event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="shippingPostalCode" className="text-sm font-medium text-gray-700">
                  Почтовый индекс
                </label>
                <input
                  id="shippingPostalCode"
                  name="shippingPostalCode"
                  type="text"
                  autoComplete="postal-code"
                  required
                  value={formState.shippingPostalCode}
                  onChange={(event) => handleChange('shippingPostalCode', event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/20"
                />
              </div>

              {errorMessage && (
                <p className="text-sm font-medium text-rose-600">{errorMessage}</p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-md bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Оформляем заказ…' : 'Подтвердить заказ'}
                </button>
                <Link
                  href="/cart"
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                >
                  Вернуться в корзину
                </Link>
              </div>
            </form>
          )}
        </div>

        <aside className="flex h-max flex-col gap-6 rounded-lg border border-gray-200 p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Состав заказа</h2>
            <p className="mt-1 text-sm text-gray-500">
              {orderResult
                ? 'Мы сохранили состав заказа для вашего удобства.'
                : `Всего ${itemCount} ${itemCount === 1 ? 'позиция' : itemCount < 5 ? 'позиции' : 'позиций'}`}
            </p>
          </div>

          <ul className="space-y-4">
            {summaryItems.map((item) => {
              const lineTotal = formatPrice(item.unitPrice * item.quantity);
              return (
                <li key={item.productSizeId} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.productName}</p>
                    <p className="text-xs text-gray-500">
                      Размер {item.productSizeValue}
                      {item.productColor ? ` · ${item.productColor}` : ''} · {item.quantity} шт.
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {lineTotal ? `${lineTotal.value} ${lineTotal.currency}` : '—'}
                  </p>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between text-base text-gray-900">
              <span>Итого</span>
              <span className="font-semibold">{totalLabel}</span>
            </div>
          </div>

          {!orderResult ? (
            <p className="text-xs text-gray-500">
              После оформления заказа мы сформируем ссылку на оплату через ЮKassa и отправим её на вашу почту.
            </p>
          ) : orderResult.payment ? (
            <p className="text-xs text-gray-500">
              Если ссылка не открывается, проверьте электронную почту или обратитесь в поддержку.
            </p>
          ) : orderResult.paymentError ? (
            <p className="text-xs text-gray-500">
              Мы уже получили заказ и скоро свяжемся с вами, чтобы завершить оплату удобным способом.
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              Платёжная система будет активирована после подтверждения профиля в ЮKassa. Мы сообщим детали оплаты дополнительно.
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}
