import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getYookassaSettings } from '@/lib/settings/yookassa';

const ADMIN_ROLES = new Set(['ADMIN', 'MANAGEMENT']);

export const metadata = {
  title: 'ЮKassa · реквизиты | Kyanchir Admin',
};

const formatValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  return typeof value === 'number' ? value.toString() : value;
};

const formatMode = (mode: 'test' | 'live') =>
  mode === 'test' ? 'Тестовый режим (sandbox)' : 'Боевой режим (live)';

export default async function YookassaPreviewPage() {
  const session = await auth();

  if (!session?.user?.role?.name || !ADMIN_ROLES.has(session.user.role.name)) {
    redirect('/admin/login');
  }

  const snapshot = await getYookassaSettings();
  const { settings, updatedAt } = snapshot;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Реквизиты YooKassa</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600">
              Ниже отображаются актуальные данные, которые будут отправлены в YooKassa при создании платежа и формировании чека.
              Страница доступна только администраторам и не раскрывает секретные ключи API.
            </p>
            <p className="mt-3 text-xs text-gray-500">
              Последнее обновление:{' '}
              {updatedAt
                ? new Intl.DateTimeFormat('ru-RU', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(updatedAt)
                : 'ещё не сохранялось'}
            </p>
          </div>

          <Link
            href="/admin/yookassa"
            className="inline-flex items-center justify-center rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
          >
            Изменить настройки
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Общие сведения</h2>
          <dl className="mt-4 space-y-3 text-sm text-gray-700">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Режим</dt>
              <dd className="mt-1 font-medium text-gray-900">{formatMode(settings.mode)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">ИНН</dt>
              <dd className="mt-1 font-medium text-gray-900">{formatValue(settings.merchantInn)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">ОГРНИП</dt>
              <dd className="mt-1 font-medium text-gray-900">{formatValue(settings.merchantOgrnip)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Полное наименование</dt>
              <dd className="mt-1 font-medium text-gray-900">{formatValue(settings.merchantFullName)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Краткое название</dt>
              <dd className="mt-1 font-medium text-gray-900">{formatValue(settings.merchantShortName)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Юридический адрес</dt>
              <dd className="mt-1 whitespace-pre-line font-medium text-gray-900">{formatValue(settings.merchantAddress)}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Контакты и чек</h2>
          <dl className="mt-4 space-y-3 text-sm text-gray-700">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Телефон поддержки</dt>
              <dd className="mt-1 font-medium text-gray-900">{formatValue(settings.contactPhone)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email поддержки</dt>
              <dd className="mt-1 font-medium text-gray-900">{formatValue(settings.contactEmail)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">URL возврата</dt>
              <dd className="mt-1 font-medium text-gray-900">{formatValue(settings.returnUrl)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Передача чеков</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {settings.receiptEnabled ? 'Включена — чеки создаёт YooKassa' : 'Выключена — чеки формируются вручную'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Система налогообложения</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {settings.taxSystemCode === null || settings.taxSystemCode === undefined
                  ? 'Не указано'
                  : `Код ${settings.taxSystemCode}`}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Ставка НДС</dt>
              <dd className="mt-1 font-medium text-gray-900">
                {settings.vatCode === null || settings.vatCode === undefined
                  ? 'Не указано'
                  : `Код ${settings.vatCode}`}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Банковские реквизиты</h2>
        <dl className="mt-4 grid gap-4 text-sm text-gray-700 md:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Банк</dt>
            <dd className="mt-1 font-medium text-gray-900">{formatValue(settings.merchantBankName)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">БИК</dt>
            <dd className="mt-1 font-medium text-gray-900">{formatValue(settings.merchantBic)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Расчётный счёт</dt>
            <dd className="mt-1 font-medium text-gray-900">{formatValue(settings.merchantBankAccount)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Корреспондентский счёт</dt>
            <dd className="mt-1 font-medium text-gray-900">{formatValue(settings.merchantCorrAccount)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Состояние ключей API</h2>
        <div className="mt-4 grid gap-4 text-sm text-gray-700 md:grid-cols-2">
          <div className="rounded-md border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Тестовый магазин</p>
            <p className="mt-1 font-medium text-gray-900">Shop ID: {formatValue(settings.test.shopId)}</p>
            <p className="mt-1 text-xs text-gray-500">
              Секретный ключ {settings.test.hasSecretKey ? 'установлен' : 'не задан'}
            </p>
          </div>
          <div className="rounded-md border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Боевой магазин</p>
            <p className="mt-1 font-medium text-gray-900">Shop ID: {formatValue(settings.live.shopId)}</p>
            <p className="mt-1 text-xs text-gray-500">
              Секретный ключ {settings.live.hasSecretKey ? 'установлен' : 'не задан'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
