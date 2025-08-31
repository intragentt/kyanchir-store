// Местоположение: /src/app/support/page.tsx

'use client'; // Эта страница требует интерактива, делаем ее клиентским компонентом

import { useState, FormEvent } from 'react';

// --- НАЧАЛО ИЗМЕНЕНИЙ ---

// Определяем тип для состояния формы
interface FormState {
  name: string;
  email: string;
  subject: string;
  content: string;
}

// Определяем тип для состояния ответа от сервера
type ServerResponse = {
  message: string;
  isError: boolean;
} | null;

export default function SupportPage() {
  // Состояние для хранения данных формы
  const [formState, setFormState] = useState<FormState>({
    name: '',
    email: '',
    subject: '',
    content: '',
  });

  // Состояние для процесса отправки (чтобы блокировать кнопку)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Состояние для хранения ответа от сервера (успех или ошибка)
  const [serverResponse, setServerResponse] = useState<ServerResponse>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); // Предотвращаем стандартное поведение формы

    // Сбрасываем предыдущие ответы сервера
    setServerResponse(null);

    // Простая валидация на клиенте
    if (!formState.email || !formState.subject || !formState.content) {
      setServerResponse({
        message: 'Пожалуйста, заполните все обязательные поля.',
        isError: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/support-form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formState),
      });

      const result = await response.json();

      if (!response.ok) {
        // Если сервер вернул ошибку
        throw new Error(result.error || 'Произошла неизвестная ошибка.');
      }

      // В случае успеха
      setServerResponse({
        message: result.message || 'Ваше обращение успешно отправлено!',
        isError: false,
      });
      // Очищаем форму
      setFormState({ name: '', email: '', subject: '', content: '' });
    } catch (error: any) {
      setServerResponse({ message: error.message, isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Свяжитесь с нами
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Мы здесь, чтобы помочь. Заполните форму ниже.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="name" className="sr-only">
                Имя
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formState.name}
                onChange={handleInputChange}
                className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
                placeholder="Имя (необязательно)"
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email*
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formState.email}
                onChange={handleInputChange}
                className="relative block w-full appearance-none rounded-none border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
                placeholder="Ваш Email*"
              />
            </div>
            <div>
              <label htmlFor="subject" className="sr-only">
                Тема*
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                required
                value={formState.subject}
                onChange={handleInputChange}
                className="relative block w-full appearance-none rounded-none border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
                placeholder="Тема обращения*"
              />
            </div>
            <div>
              <label htmlFor="content" className="sr-only">
                Сообщение*
              </label>
              <textarea
                id="content"
                name="content"
                rows={5}
                required
                value={formState.content}
                onChange={handleInputChange}
                className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
                placeholder="Ваше сообщение*"
              />
            </div>
          </div>

          {/* Блок для отображения сообщений от сервера */}
          {serverResponse && (
            <div
              className={`rounded-md p-4 text-sm ${serverResponse.isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
            >
              {serverResponse.message}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isSubmitting ? 'Отправка...' : 'Отправить обращение'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---
