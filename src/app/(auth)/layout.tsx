// Местоположение: /src/app/(auth)/layout.tsx
// Этот макет применяется ко всем страницам в группе (auth)
// и НЕ содержит общей шапки сайта.

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}