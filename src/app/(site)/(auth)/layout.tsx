// Местоположение: /src/app/(auth)/layout.tsx
// Этот макет перехватывает ВСЕ страницы внутри группы (auth)
// и даёт им простой, пустой "холст" без шапки и подвала.

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
