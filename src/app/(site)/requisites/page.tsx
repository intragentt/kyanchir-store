import type { Metadata } from 'next';
import { getYookassaSettings } from '@/lib/settings/yookassa';

export const metadata: Metadata = {
  title: 'Реквизиты для YooKassa | Kyanchir Store',
  description:
    'Контакты и реквизиты индивидуального предпринимателя Kyanchir Store, а также краткий чек-лист требований YooKassa к сайту.',
};

const suitabilityList = [
  'у вас самописный сайт',
  'у вас сайт на конструкторе, CMS, SaaS и т. п.',
  'вы работаете с Yclients или DIKIDI',
];

const requirementSections = [
  {
    title: 'Настоящие товары или услуги, цены, описания',
    description:
      'Проверьте, что на сайте представлены актуальные товары и услуги: без тестового наполнения, с корректными фотографиями, названиями, описаниями и ценами.',
  },
  {
    title: 'Информация о способах доставки или получения заказа',
    description:
      'Если продаёте физические товары — опишите способы и сроки доставки. Для цифровых продуктов поясните, как клиент получит заказ после оплаты.',
  },
  {
    title: 'Пользовательское соглашение или оферта',
    description:
      'Для сервисов и услуг добавьте публичную оферту или пользовательское соглашение с юридическими условиями оказания услуг.',
  },
  {
    title: 'Контакты и реквизиты',
    description:
      'Укажите телефон, почтовый адрес, email и реквизиты самозанятого (ФИО, ИНН), чтобы YooKassa могла сверить данные.',
  },
];

const formatValue = (value: string | null | undefined): string => {
  if (!value) {
    return '—';
  }

  return value;
};

const maskAccount = (value: string | null | undefined): string => {
  if (!value) {
    return '—';
  }

  const digitsOnly = value.replace(/\s+/g, '');

  if (digitsOnly.length <= 4) {
    return value;
  }

  const visibleTail = digitsOnly.slice(-4);
  return `•••• •••• •••• ${visibleTail}`;
};

export default async function RequisitesPage() {
  const snapshot = await getYookassaSettings();
  const { settings, updatedAt } = snapshot;

  const merchantDetails = [
    { label: 'Индивидуальный предприниматель', value: settings.merchantFullName },
    { label: 'ИНН', value: settings.merchantInn },
    { label: 'ОГРНИП', value: settings.merchantOgrnip },
    { label: 'Юридический адрес', value: settings.merchantAddress },
  ];

  const contactDetails = [
    { label: 'Телефон', value: settings.contactPhone },
    { label: 'Email', value: settings.contactEmail },
  ];

  const bankDetails = [
    { label: 'Банк', value: settings.merchantBankName },
    { label: 'БИК', value: settings.merchantBic },
    { label: 'Корреспондентский счёт', value: settings.merchantCorrAccount },
    {
      label: 'Расчётный счёт',
      value:
        settings.merchantBankAccount && settings.merchantBankAccount.length > 0
          ? maskAccount(settings.merchantBankAccount)
          : null,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-16">
      <header className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Платежи на сайте</p>
        <h1 className="text-3xl font-bold text-gray-900">Реквизиты и требования YooKassa</h1>
        <p className="text-base text-gray-600">
          Страница собрана для модерации YooKassa: ниже указаны реквизиты индивидуального предпринимателя и чек-лист, который
          сервис просит разместить на публичной странице перед включением онлайн-оплаты.
        </p>
        {updatedAt && (
          <p className="text-xs text-gray-500">
            Последнее обновление данных:{' '}
            {new Intl.DateTimeFormat('ru-RU', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }).format(updatedAt)}
          </p>
        )}
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Когда подходит подключение «Платежи на сайте»</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-700">
          {suitabilityList.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-gray-500">
          Если на сайте не хватает какого-либо блока, доработайте его перед отправкой заявки: YooKassa подключает только готовые
          проекты с актуальным контентом.
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Что разместить на сайте для модерации</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {requirementSections.map((section) => (
            <div key={section.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{section.description}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
          <p>
            YooKassa также просит указать прямую ссылку на эту страницу в кабинете: <span className="font-medium">https://kyanchir.ru/requisites</span>.
            На странице обязательно присутствует ИНН самозанятого, поэтому можно продублировать адрес сайта в соответствующем поле.
          </p>
          <p className="mt-3">
            Оборот свыше 5 млн ₽ в месяц можно согласовать отдельно — YooKassa предложит индивидуальные условия после проверки сайта.
          </p>
        </div>
      </section>

      <section className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Реквизиты продавца</h2>
          <p className="mt-2 text-sm text-gray-600">
            Эти сведения используются YooKassa для оформления чеков и подтверждения личности индивидуального предпринимателя.
          </p>
          <dl className="mt-6 grid gap-6 sm:grid-cols-2">
            {merchantDetails.map((item) => (
              <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{item.label}</dt>
                <dd className="mt-2 text-sm font-medium text-gray-900">{formatValue(item.value)}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900">Контакты</h2>
          <p className="mt-2 text-sm text-gray-600">
            Связаться с продавцом можно по указанным каналам. Убедитесь, что данные совпадают с настройками в кабинете YooKassa.
          </p>
          <dl className="mt-6 grid gap-6 sm:grid-cols-2">
            {contactDetails.map((item) => (
              <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{item.label}</dt>
                <dd className="mt-2 text-sm font-medium text-gray-900">{formatValue(item.value)}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900">Банковские реквизиты</h2>
          <p className="mt-2 text-sm text-gray-600">
            YooKassa сверяет данные банка и БИК. Расчётный счёт можно скрыть частично — на странице отображаются только последние цифры.
          </p>
          <dl className="mt-6 grid gap-6 sm:grid-cols-2">
            {bankDetails.map((item) => (
              <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{item.label}</dt>
                <dd className="mt-2 text-sm font-medium text-gray-900">{formatValue(item.value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}
