// Местоположение: /src/app/admin/mail/MailClient.tsx
'use client';

import { useState } from 'react';
import {
  SupportTicket,
  SupportMessage,
  SupportAgent,
  AgentRole,
} from '@prisma/client';

// --- НАЧАЛО ИЗМЕНЕНИЙ ---
// Создаем более полный тип для сообщения, включающий информацию об агенте
type MessageWithAgent = SupportMessage & {
  agent: { name: string; role: AgentRole } | null;
};
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

const SourceIcon = ({ source }: { source: SupportTicket['source'] | null }) => {
  // ... (код без изменений)
};

const formatDate = (dateString: Date) => {
  // ... (код без изменений)
};

type MailClientProps = {
  initialTickets: SupportTicket[];
  initialError: string | null;
};

export default function MailClient({
  initialTickets,
  initialError,
}: MailClientProps) {
  const [tickets, setTickets] = useState(initialTickets);
  const [error, setError] = useState(initialError);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    initialTickets[0] || null,
  );

  // --- НАЧАЛО ИЗМЕНЕНИЙ ---
  // Новые состояния для переписки
  const [messages, setMessages] = useState<MessageWithAgent[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Новые состояния для формы ответа
  const [replyText, setReplyText] = useState('');
  const [selectedEmail, setSelectedEmail] = useState('support@kyanchir.ru');
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  // Функция для загрузки сообщений при выборе тикета
  const handleTicketSelect = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setIsLoadingMessages(true);
    setMessages([]); // Очищаем старые сообщения

    try {
      const response = await fetch(`/api/admin/tickets/${ticket.id}`);
      if (!response.ok) {
        throw new Error('Не удалось загрузить переписку');
      }

      const data: MessageWithAgent[] = await response.json();
      setMessages(data);
    } catch (e) {
      // TODO: Показать ошибку загрузки сообщений
      console.error(e);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Функция для отправки ответа (пока заглушка)
  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;

    console.log({
      message: 'Отправка ответа (пока заглушка)',
      ticketId: selectedTicket.id,
      fromEmail: selectedEmail,
      text: replyText,
    });

    // TODO: Реализовать POST-запрос на /api/admin/tickets/[id]/reply
    alert(
      `Ответ отправлен (заглушка):\n\nОт: ${selectedEmail}\nКому: ${selectedTicket.clientEmail}\n\n${replyText}`,
    );
    setReplyText(''); // Очищаем поле ввода
  };

  // --- ... (остальной код остается почти таким же, меняются только onClick и Колонка 3)

  const availableEmails = ['support@kyanchir.ru' /* ... */];

  return (
    <div className="flex h-[calc(100vh-4rem)] ...">
      {/* ... Колонка 1 и 2 без существенных изменений, только onClick ... */}
      <section className="w-1/3 overflow-y-auto border-r">
        {/* ... */}
        <ul>
          {tickets.map((ticket) => (
            <li
              key={ticket.id}
              onClick={() => handleTicketSelect(ticket)}
              className={`...`}
            >
              {/* ... */}
            </li>
          ))}
        </ul>
      </section>

      {/* --- КОЛОНКА 3: ПОЛНОСТЬЮ ОБНОВЛЕННАЯ --- */}
      <main className="flex w-full flex-col overflow-y-auto p-4">
        {selectedTicket ? (
          <>
            <div className="mb-4 border-b pb-4">
              <h1 className="mb-1 flex items-center text-2xl font-bold">...</h1>
              <p>От: ...</p>
              <p>На email: ...</p>
            </div>

            {/* Зона переписки */}
            <div className="prose mb-4 flex-grow overflow-y-auto">
              {isLoadingMessages && <p>Загрузка переписки...</p>}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-bubble mb-4 max-w-[80%] rounded-lg p-3 ${
                    msg.senderType === 'CLIENT'
                      ? 'self-start bg-gray-200'
                      : 'ml-auto self-end bg-blue-500 text-white'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="mt-1 text-right text-xs opacity-75">
                    {msg.senderType === 'AGENT'
                      ? `Отправлено: ${msg.agent?.name || 'Агент'}`
                      : `Получено`}
                  </p>
                </div>
              ))}
            </div>

            {/* Форма ответа */}
            <div className="mt-auto border-t pt-4">
              <textarea
                placeholder="Напишите ваш ответ..."
                rows={5}
                className="mb-2 w-full rounded border p-2"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <label htmlFor="from-email" className="text-sm text-gray-600">
                    Ответить с:
                  </label>
                  <select
                    id="from-email"
                    className="rounded border p-2 text-sm"
                    value={selectedEmail}
                    onChange={(e) => setSelectedEmail(e.target.value)}
                  >
                    {availableEmails.map((email) => (
                      <option key={email} value={email}>
                        {email}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleSendReply}
                  className="rounded bg-blue-600 px-6 py-2 font-bold text-white hover:bg-blue-700 disabled:bg-gray-400"
                  disabled={!replyText.trim()}
                >
                  Отправить
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            <p>Выберите обращение из списка слева</p>
          </div>
        )}
      </main>
    </div>
  );
}
