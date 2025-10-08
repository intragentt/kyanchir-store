// Местоположение: src/components/Footer.tsx
export default function Footer() {
  const currentYear = new Date().getFullYear(); // Автоматически получаем текущий год
  return (
    <footer className="mt-20 border-t border-zinc-700 px-8 py-6 text-center text-zinc-500">
      <p>© {currentYear} Kyanchir Store. Интернет-магазин авторских украшений.</p>
    </footer>
  );
}
