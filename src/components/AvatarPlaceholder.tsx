// Местоположение: /src/components/AvatarPlaceholder.tsx
// Этот компонент отвечает за отображение "заглушки" для аватара.

import ShortLogo from './icons/ShortLogo';

export default function AvatarPlaceholder() {
  return (
    // Контейнер, который центрирует логотип внутри себя
    <div className="flex h-full w-full items-center justify-center bg-gray-100">
      {/* --- НАЧАЛО ИЗМЕНЕНИЙ: Уменьшаем размер и контраст --- */}
      <ShortLogo className="h-6 w-auto text-gray-300" />
      {/* --- КОНЕЦ ИЗМЕНЕНИЙ --- */}
    </div>
  );
}
