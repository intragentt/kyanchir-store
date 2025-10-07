'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  useCartStore,
  selectCartItems,
  selectCartItemCount,
  selectCartTotal,
} from '@/store/useCartStore';
import { formatPrice } from '@/utils/formatPrice';
import { TrashIcon } from '@/components/shared/icons';
import { createSlug } from '@/utils/createSlug';

const formatItemsLabel = (count: number) => {
  if (count === 1) return 'товар';
  if (count >= 2 && count <= 4) return 'товара';
  return 'товаров';
};

export default function CartPage() {
  const items = useCartStore(selectCartItems);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const itemCount = useCartStore(selectCartItemCount);
  const totalAmount = useCartStore(selectCartTotal);

  const formattedTotal = formatPrice(totalAmount);
  const totalLabel = formattedTotal
    ? `${formattedTotal.value} ${formattedTotal.currency}`
    : '0 RUB';

  if (items.length === 0) {
    return (
      <section className="mx-auto flex max-w-3xl flex-col gap-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-gray-900">Корзина пуста</h1>
          <p className="text-base text-gray-500">
            Вы ещё не добавили товары. Исследуйте каталог, чтобы выбрать свой первый комплект.
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
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            На главную
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-gray-900">Корзина</h1>
        <p className="text-sm text-gray-500">
          {itemCount} {formatItemsLabel(itemCount)} в вашем списке
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {items.map((item) => {
            const itemTotal = formatPrice(item.price * item.quantity);
            const unitPrice = formatPrice(item.price);
            const isDecreaseDisabled = item.quantity <= 1;
            const isIncreaseDisabled = item.quantity >= item.maxQuantity;
            const stockLeft = item.maxQuantity - item.quantity;

            const productLink = item.productSlug ?? createSlug(item.name);

            return (
              <article
                key={item.productSizeId}
                className="flex flex-col gap-4 rounded-lg border border-gray-200 p-4 shadow-sm sm:flex-row"
              >
                <Link
                  href={`/p/${productLink}`}
                  className="flex h-32 w-full flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100 sm:h-32 sm:w-32"
                >
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={128}
                      height={128}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-gray-500">{item.size}</span>
                  )}
                </Link>

                <div className="flex flex-1 flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <Link
                      href={`/p/${productLink}`}
                      className="text-base font-semibold text-gray-900 transition hover:text-gray-700"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm text-gray-500">
                      Размер {item.size}
                      {item.color ? ` · Цвет ${item.color}` : ''}
                    </p>
                    <p className="text-sm text-gray-500">
                      {unitPrice
                        ? `Цена за единицу: ${unitPrice.value} ${unitPrice.currency}`
                        : 'Цена уточняется'}
                    </p>
                    {item.maxQuantity > 0 && stockLeft <= 3 && (
                      <p className="text-xs font-medium text-amber-600">
                        Осталось {stockLeft > 0 ? stockLeft : 0} шт. на складе
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productSizeId, item.quantity - 1)}
                        disabled={isDecreaseDisabled}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-lg font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Уменьшить количество"
                      >
                        −
                      </button>
                      <span className="min-w-[32px] text-center text-base font-semibold text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productSizeId, item.quantity + 1)}
                        disabled={isIncreaseDisabled}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-lg font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Увеличить количество"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <p className="text-base font-semibold text-gray-900">
                        {itemTotal
                          ? `${itemTotal.value} ${itemTotal.currency}`
                          : '—'}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productSizeId)}
                        aria-label="Удалить из корзины"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:text-gray-700"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="flex h-max flex-col gap-6 rounded-lg border border-gray-200 p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Итого</h2>
            <p className="mt-1 text-sm text-gray-500">Без учёта доставки</p>
          </div>
          <dl className="space-y-2">
            <div className="flex items-center justify-between text-base text-gray-900">
              <dt>Сумма заказа</dt>
              <dd className="font-semibold">{totalLabel}</dd>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <dt>Количество</dt>
              <dd>{itemCount}</dd>
            </div>
          </dl>
          <Link
            href="/checkout"
            className="inline-flex items-center justify-center rounded-md bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Перейти к оформлению
          </Link>
          <p className="text-xs text-gray-500">
            Оформляя заказ, вы подтверждаете согласие с политикой конфиденциальности и условиями сервиса.
          </p>
        </aside>
      </div>
    </section>
  );
}
