// Местоположение: src/components/Footer.tsx
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear(); // Автоматически получаем текущий год
  return (
    <footer className="mt-20 border-t border-zinc-700 px-8 py-6 text-center text-zinc-500">
      <p>© {currentYear} Kyanchir Store. Интернет-магазин авторских украшений.</p>
      <p className="mt-2 text-sm">
        <Link
          href="/requisites"
          className="text-indigo-600 underline-offset-4 transition hover:text-indigo-700 hover:underline"
        >
          Реквизиты и требования YooKassa
        </Link>
      </p>
    </footer>
  );
}
