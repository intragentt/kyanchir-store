// Местоположение: src/config/navigation.ts

type NavLink = {
  label: string;
  href: string;
};

export const NAV_LINKS: NavLink[] = [
  { label: 'Все товары', href: '/catalog' }, // Убедись, что эта ссылка есть и не закомментирована
  { label: 'Новинки', href: '/new' },
  { label: 'Бренды', href: '/brands' },
  { label: 'О нас', href: '/about' }, // Если есть
  { label: 'UI-Кит (Типографика)', href: '/styleguide/typography' }, // Временная, для отладки
];