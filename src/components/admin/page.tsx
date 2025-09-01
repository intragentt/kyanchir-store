// Местоположение: /src/app/admin/page.tsx

import { redirect } from 'next/navigation';

// --- НАЧАЛО ИЗМЕНЕНИЙ ---

/**
 * Эта страница никогда не будет показана пользователю.
 * Ее единственная задача - мгновенно перенаправить
 * любого, кто заходит на /admin, на страницу /admin/dashboard.
 */
export default function AdminRootPage() {
  redirect('/admin/dashboard');

  // Мы можем вернуть null или пустой div, 
  // так как редирект происходит на сервере до рендеринга.
  return null;
}
// --- КОНЕЦ ИЗМЕНЕНИЙ ---