// Местоположение: /src/app/admin/mail/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { SupportTicket } from '@prisma/client';

// Компонент-хелпер для отображения иконок источника
const SourceIcon = ({ source }: { source: SupportTicket['source'] | null }) => {
  let icon = '📧'; // Email по умолчанию
  let tooltip = 'Пришло с почты';
  if (source === 'WEB_FORM') {
    icon = '🌐';
    tooltip = 'Заполнена форма на сайте';
  } else if (source === 'TELEGRAM_BOT') {
    icon = '🤖';
    tooltip = 'Обращение из Telegram бота';
  }
  return (
    <span title={tooltip} className="mr-2 text-lg">
      {icon}
    </span>
  );
};

// Функция для красивого форматирования даты
const formatDate = (dateString: Date) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
};

// Тип для хранения состояния нашего компонента
type TicketsState = {
  tickets: SupportTicket[];
  isLoading: boolean;
  error: string | null;
};

export default function AdminMailPage() {
  const [state, setState] = useState<TicketsState>({
    tickets: [],
    isLoading: true,
    error: null,
  });
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null,
  );

  // useEffect для загрузки данных при монтировании компонента
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setState((prevState) => ({
          ...prevState,
          isLoading: true,
          error: null,
        }));

        const response = await fetch('/api/admin/tickets'); // Простой fetch

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Ошибка сервера: ${response.status}`,
          );
        }

        const data: SupportTicket[] = await response.json();
        setState({ tickets: data, isLoading: false, error: null });

        if (data.length > 0) {
          setSelectedTicket(data[0]);
        }
      } catch (err: any) {
        setState({ tickets: [], isLoading: false, error: err.message });
      }
    };
    fetchTickets();
  }, []); // Пустой массив зависимостей = выполнить 1 раз

  const availableEmails = [
    'support@kyanchir.ru',
    'yana@kyanchir.ru',
    'artem@kyanchir.ru',
    'promo@kyanchir.ru',
    'hello@kyanchir.ru',
  ];

  const openTicketsCount = state.tickets.filter(
    (t) => t.status === 'OPEN',
  ).length;

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-lg bg-white shadow-md">
      <aside className="w-1/5 border-r bg-gray-50 p-4">
        <h2 className="mb-4 text-xl font-bold">Папки</h2>
        <nav>
          <ul>
            <li className="mb-2">
              <a href="#" className="font-semibold text-blue-600">
                Входящие ({openTicketsCount})
              </a>
            </li>
            <li className="mb-2">
              <a href="#" className="text-gray-700 hover:text-blue-600">
                В работе (0)
              </a>
            </li>
            <li className="mb-2">
              <a href="#" className="text-gray-700 hover:text-blue-600">
                Закрытые (0)
              </a>
            </li>
          </ul>
        </nav>
      </aside>
      <section className="w-1/3 overflow-y-auto border-r">
        <div className="border-b p-4">
          <input
            type="search"
            placeholder="Поиск в почте..."
            className="w-full rounded border p-2"
          />
        </div>
        {state.isLoading && (
          <p className="p-4 text-center text-gray-500">Загрузка тикетов...</p>
        )}
        {state.error && (
          <div className="bg-red-50 p-4 text-center text-red-600">
            <b>Ошибка:</b>
            <p>{state.error}</p>
          </div>
        )}
        {!state.isLoading && state.tickets.length === 0 && !state.error && (
          <p className="p-4 text-center text-gray-500">Нет новых обращений.</p>
        )}
        <ul>
          {state.tickets.map((ticket) => (
            <li
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className={`cursor-pointer border-b p-4 hover:bg-gray-50 ${selectedTicket?.id === ticket.id ? 'bg-blue-100' : ''}`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="truncate font-bold text-gray-800">
                  {ticket.clientEmail}
                </span>
                <span className="flex-shrink-0 text-xs text-gray-500">
                  {formatDate(ticket.createdAt)}
                </span>
              </div>
              <p className="flex items-center truncate text-sm text-gray-700">
                <SourceIcon source={ticket.source} />
                {ticket.subject}
              </p>
            </li>
          ))}
        </ul>
      </section>
      <main className="flex w-full flex-col overflow-y-auto p-4">
        {selectedTicket ? (
          <>
            <div className="mb-4 border-b pb-4">
              <h1 className="mb-1 flex items-center text-2xl font-bold">
                <SourceIcon source={selectedTicket.source} />
                {selectedTicket.subject}
              </h1>
              <p className="text-sm text-gray-600">
                От:{' '}
                <span className="font-semibold">
                  {selectedTicket.clientEmail}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                На email:{' '}
                <span className="font-semibold">
                  {selectedTicket.assignedEmail || '-'}
                </span>
              </p>
            </div>
            <div className="prose mb-4 flex-grow">
              <p>
                Здесь будет отображаться вся история сообщений по этому
                тикету...
              </p>
            </div>
            <div className="mt-auto border-t pt-4">
              <textarea
                placeholder="Напишите ваш ответ..."
                rows={5}
                className="mb-2 w-full rounded border p-2"
              ></textarea>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <label htmlFor="from-email" className="text-sm text-gray-600">
                    Ответить с:
                  </label>
                  <select
                    id="from-email"
                    className="rounded border p-2 text-sm"
                  >
                    {availableEmails.map((email) => (
                      <option key={email} value={email}>
                        {email}
                      </option>
                    ))}
                  </select>
                </div>
                <button className="rounded bg-blue-600 px-6 py-2 font-bold text-white hover:bg-blue-700">
                  Отправить
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            <p>
              {state.isLoading
                ? 'Загрузка...'
                : 'Выберите обращение из списка слева'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
