// Местоположение: src/app/admin/page.tsx

import { redirect } from 'next/navigation';

/**
 * Эта страница никогда не будет показана пользователю.
 * Ее единственная задача - мгновенно перенаправить
 * любого, кто заходит на корень админки (admin.kyanchir.ru/),
 * на страницу дашборда.
 *
 * КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Мы убираем /admin из пути, так как middleware
 * уже "поместил" нас внутрь контекста админки.
 */
export default function AdminRootPage() {
  redirect('/dashboard');
  return null;
}
