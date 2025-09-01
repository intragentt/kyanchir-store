// Местоположение: /src/app/admin/mail/page.tsx
'use client'; // Этот компонент будет интерактивным

import { useState } from 'react';

// --- НАЧАЛО ИЗМЕНЕНИЙ ---

// Типы для моковых данных (позже будем брать из Prisma)
type MockTicket = {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  timestamp: string;
  status: 'OPEN' | 'PENDING' | 'RESOLVED';
};

// Моковые (тестовые) данные, чтобы видеть структуру
const mockTickets: MockTicket[] = [
  {
    id: '1',
    from: 'elena.v@example.com',
    subject: 'Вопрос по заказу #1234',
    snippet: 'Здравствуйте, не могу отследить посылку...',
    timestamp: '14:28',
    status: 'OPEN',
  },
  {
    id: '2',
    from: 'ivan.p@example.com',
    subject: 'Проблема с оплатой',
    snippet: 'Не проходит платеж по карте...',
    timestamp: '12:05',
    status: 'PENDING',
  },
  {
    id: '3',
    from: 'olga.s@example.com',
    subject: 'Предложение о сотрудничестве',
    snippet: 'Добрый день, я представляю бренд...',
    timestamp: 'Вчера',
    status: 'OPEN',
  },
  {
    id: '4',
    from: 'petr.k@example.com',
    subject: 'Возврат товара',
    snippet: 'Хочу вернуть товар, который не подошел...',
    timestamp: '29 авг',
    status: 'RESOLVED',
  },
];

const availableEmails = [
  'support@kyanchir.ru',
  'yana@kyanchir.ru',
  'artem@kyanchir.ru',
  'promo@kyanchir.ru',
  'hello@kyanchir.ru',
];

export default function AdminMailPage() {
  const [selectedTicket, setSelectedTicket] = useState<MockTicket | null>(
    mockTickets[0],
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-lg bg-white shadow-md">
      {/* --- КОЛОНКА 1: ПАПКИ --- */}
      <aside className="w-1/5 border-r bg-gray-50 p-4">
        <h2 className="mb-4 text-xl font-bold">Папки</h2>
        <nav>
          <ul>
            <li className="mb-2">
              <a href="#" className="font-semibold text-blue-600">
                Входящие (3)
              </a>
            </li>
            <li className="mb-2">
              <a href="#" className="text-gray-700 hover:text-blue-600">
                В работе (1)
              </a>
            </li>
            <li className="mb-2">
              <a href="#" className="text-gray-700 hover:text-blue-600">
                Отправленные
              </a>
            </li>
            <li className="mb-2">
              <a href="#" className="text-gray-700 hover:text-blue-600">
                Закрытые (1)
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      {/* --- КОЛОНКА 2: СПИСОК ТИКЕТОВ --- */}
      <section className="w-1/3 overflow-y-auto border-r">
        <div className="border-b p-4">
          <input
            type="search"
            placeholder="Поиск в почте..."
            className="w-full rounded border p-2"
          />
        </div>
        <ul>
          {mockTickets.map((ticket) => (
            <li
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className={`cursor-pointer border-b p-4 hover:bg-gray-50 ${selectedTicket?.id === ticket.id ? 'bg-blue-100' : ''}`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="font-bold text-gray-800">{ticket.from}</span>
                <span className="text-xs text-gray-500">
                  {ticket.timestamp}
                </span>
              </div>
              <p className="truncate text-sm text-gray-700">{ticket.subject}</p>
              <p className="truncate text-xs text-gray-500">{ticket.snippet}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* --- КОЛОНКА 3: ПРОСМОТР И ОТВЕТ --- */}
      <main className="flex w-full flex-col overflow-y-auto p-4">
        {selectedTicket ? (
          <>
            <div className="mb-4 border-b pb-4">
              <h1 className="mb-1 text-2xl font-bold">
                {selectedTicket.subject}
              </h1>
              <p className="text-sm text-gray-600">
                От: <span className="font-semibold">{selectedTicket.from}</span>
              </p>
            </div>

            {/* Область переписки (пока заглушка) */}
            <div className="mb-4 flex-grow">
              <p>Тело письма или переписки будет здесь...</p>
              <br />
              <p>{selectedTicket.snippet}</p>
            </div>

            {/* Форма ответа */}
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
            <p>Выберите обращение из списка</p>
          </div>
        )}
      </main>
    </div>
  );
}

// --- КОНЕЦ ИЗМЕНЕНИЙ ---
