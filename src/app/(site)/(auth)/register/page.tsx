// Местоположение: src/app/(auth)/register/page.tsx
'use client';

import { useState, FormEvent, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { ClearIcon, EyeIcon, EyeOffIcon, Logo, TelegramOfficialIcon } from '@/components/shared/icons';
import Link from 'next/link';

const validateEmail = (email: string) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // --- ИЗМЕНЕНИЕ: Разделяем имя и фамилию ---
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob_day: '',
    dob_month: '',
    dob_year: '',
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNextStep = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (step === 1) {
      if (!validateEmail(formData.email))
        return setError('Пожалуйста, введите корректный Email.');
      setStep(2);
    } else if (step === 2) {
      if (formData.password.length < 8)
        return setError('Пароль должен содержать не менее 8 символов.');
      if (formData.password !== formData.confirmPassword)
        return setError('Пароли не совпадают.');
      setStep(3);
    }
  };

  const handleRegisterSubmit = async () => {
    setError(null);
    // --- ИЗМЕНЕНИЕ: Проверяем оба поля имени ---
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      return setError('Пожалуйста, введите ваше имя и фамилию.');
    }
    if (!termsAccepted) {
      return setError('Необходимо принять пользовательское соглашение.');
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // --- ИЗМЕНЕНИЕ: Собираем полное имя перед отправкой ---
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Не удалось завершить регистрацию.');
      }

      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error(
          'Аккаунт создан, но войти не удалось. Попробуйте на странице входа.',
        );
      }
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Непредвиденная ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  // --- НАЧАЛО ИЗМЕНЕНИЙ: Генераторы для выпадающих списков ---
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 100 }, (_, i) => currentYear - i);
  }, []);

  const months = useMemo(
    () => [
      { value: '01', label: 'Январь' },
      { value: '02', label: 'Февраль' },
      { value: '03', label: 'Март' },
      { value: '04', label: 'Апрель' },
      { value: '05', label: 'Май' },
      { value: '06', label: 'Июнь' },
      { value: '07', label: 'Июль' },
      { value: '08', label: 'Август' },
      { value: '09', label: 'Сентябрь' },
      { value: '10', label: 'Октябрь' },
      { value: '11', label: 'Ноябрь' },
      { value: '12', label: 'Декабрь' },
    ],
    [],
  );

  const days = useMemo(() => Array.from({ length: 31 }, (_, i) => i + 1), []);
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 px-4 pt-20 sm:pt-24">
      <div className="w-full max-w-sm">
        <div className="space-y-5 rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <Link
            href="/"
            className="mx-auto flex h-12 w-auto justify-center text-[#6B80C5] transition-transform hover:scale-105"
          >
            <div className="mt-2 scale-125 transform">
              <Logo />
            </div>
          </Link>

          <form
            className="space-y-4 text-left font-body"
            onSubmit={(e) => e.preventDefault()}
            noValidate
          >
            {step === 1 && (
              <>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-style"
                    placeholder="Email"
                  />
                </div>
                <button onClick={handleNextStep} className="button-style">
                  Продолжить
                </button>
              </>
            )}

            {step === 2 && (
              <>
                {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Поле пароля с двумя иконками --- */}
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    className="input-style pr-16"
                    placeholder="Пароль (мин. 8 символов)"
                  />
                  {formData.password && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="mr-2"
                      >
                        <div className="h-5 w-5 text-zinc-400 hover:text-zinc-600">
                          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((p) => ({ ...p, password: '' }))
                        }
                      >
                        <ClearIcon className="h-5 w-5 text-zinc-400 hover:text-zinc-600" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="input-style pr-16"
                    placeholder="Подтвердите пароль"
                  />
                  {formData.confirmPassword && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="mr-2"
                      >
                        <div className="h-5 w-5 text-zinc-400 hover:text-zinc-600">
                          {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((p) => ({ ...p, confirmPassword: '' }))
                        }
                      >
                        <ClearIcon className="h-5 w-5 text-zinc-400 hover:text-zinc-600" />
                      </button>
                    </div>
                  )}
                </div>
                {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
                <button onClick={handleNextStep} className="button-style">
                  Продолжить
                </button>
              </>
            )}

            {step === 3 && (
              <>
                {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Разделенные поля для имени --- */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="input-style"
                    placeholder="Имя"
                  />
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="input-style"
                    placeholder="Фамилия"
                  />
                </div>
                {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
                {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Выпадающие списки для даты рождения --- */}
                <div className="grid grid-cols-3 gap-2">
                  <select
                    name="dob_day"
                    value={formData.dob_day}
                    onChange={handleInputChange}
                    className="input-style text-center"
                  >
                    <option value="">ДД</option>
                    {days.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <select
                    name="dob_month"
                    value={formData.dob_month}
                    onChange={handleInputChange}
                    className="input-style text-center"
                  >
                    <option value="">ММ</option>
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <select
                    name="dob_year"
                    value={formData.dob_year}
                    onChange={handleInputChange}
                    className="input-style text-center"
                  >
                    <option value="">ГГГГ</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
                <div className="flex items-center">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="terms"
                    className="ml-2 block text-sm text-zinc-700"
                  >
                    Я согласен с{' '}
                    <a
                      href="#"
                      className="font-semibold text-[#6B80C5] hover:text-opacity-80"
                    >
                      пользовательским соглашением
                    </a>
                  </label>
                </div>
                <button
                  onClick={handleRegisterSubmit}
                  disabled={isLoading}
                  className="button-style"
                >
                  {isLoading ? 'Создание...' : 'Создать аккаунт'}
                </button>
              </>
            )}

            {error && (
              <p className="pt-2 text-center text-xs text-red-600">{error}</p>
            )}
          </form>

          <div className="flex items-center gap-x-3">
            <div className="h-px w-full bg-zinc-200" />
            <div className="font-body text-sm font-medium text-zinc-400">
              ИЛИ
            </div>
            <div className="h-px w-full bg-zinc-200" />
          </div>
          <button
            onClick={() =>
              (window.location.href = 'https://t.me/kyanchir_store_bot')
            }
            className="flex w-full items-center justify-center gap-x-2 rounded-md border border-zinc-300 bg-white px-4 py-2 font-body text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
          >
            <TelegramOfficialIcon className="h-6 w-6" />
            Войти через Telegram
          </button>
        </div>
        <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 text-center font-body text-sm">
          <p className="text-zinc-600">
            Уже есть аккаунт?{' '}
            <Link
              href="/login"
              className="font-semibold text-[#6B80C5] hover:text-opacity-80"
            >
              Войти
            </Link>
          </p>
        </div>
      </div>
      <style jsx>{`
        .input-style {
          display: block;
          width: 100%;
          border-radius: 0.375rem;
          border-width: 1px;
          border-color: #d4d4d8;
          background-color: #fafafa;
          padding: 0.5rem 0.75rem;
          font-size: 1rem;
          line-height: 1.5rem;
          color: #18181b;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        }
        .input-style::placeholder {
          color: #a1a1aa;
        }
        .input-style:focus {
          border-color: #6366f1;
          outline: none;
          box-shadow: 0 0 0 1px #6366f1;
        }
        .button-style {
          width: 100%;
          border-radius: 0.375rem;
          background-color: #6b80c5;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          line-height: 1.25rem;
          font-weight: 600;
          color: white;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        }
        .button-style:hover {
          opacity: 0.9;
        }
        .button-style:disabled {
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
}
