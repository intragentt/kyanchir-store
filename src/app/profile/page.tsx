// Местоположение: src/app/profile/page.tsx
import PageContainer from '@/components/layout/PageContainer';
import React from 'react';

export default function ProfilePage() {
  return (
    <main>
      <PageContainer className="py-12">
        <h1 className="text-2xl font-bold">Личный кабинет</h1>
        <p className="mt-4">Здесь будет информация о заказах и бонусах.</p>
      </PageContainer>
    </main>
  );
}
