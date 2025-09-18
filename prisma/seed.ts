// prisma/seed.ts
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // --- ШАГ 1: ОЧИСТКА ---
  console.log('🧹 Очистка старых данных...');
  // Удаляем в правильном порядке, чтобы избежать ошибок внешних ключей
  await prisma.presetItem.deleteMany();
  await prisma.filterPreset.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productSize.deleteMany();
  await prisma.image.deleteMany();
  await prisma.attribute.deleteMany();
  await prisma.alternativeName.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supportMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.supportAgent.deleteMany();
  await prisma.user.deleteMany();

  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.size.deleteMany();
  await prisma.supportRoute.deleteMany();
  await prisma.status.deleteMany();
  await prisma.orderStatus.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.agentRole.deleteMany();
  await prisma.ticketStatus.deleteMany();
  await prisma.ticketSource.deleteMany();
  await prisma.senderType.deleteMany();
  await prisma.presetItemType.deleteMany();

  // --- ШАГ 2: СОЗДАНИЕ ЗАПИСЕЙ В СПРАВОЧНИКАХ ---
  console.log('📚 Создание записей в справочниках...');

  console.log('   - Создание статусов продуктов...');
  await prisma.status.createMany({
    data: [{ name: 'DRAFT' }, { name: 'PUBLISHED' }, { name: 'ARCHIVED' }],
  });

  // --- НАЧАЛО ИЗМЕНЕНИЙ ---
  console.log('   - Создание ролей пользователей (ADMIN, MANAGEMENT, USER)...');
  // Создаем все три роли, которые ожидает система.
  // 'CLIENT' заменена на 'USER' для соответствия с API регистрации.
  await prisma.userRole.createMany({
    data: [{ name: 'ADMIN' }, { name: 'MANAGEMENT' }, { name: 'USER' }],
  });
  // --- КОНЕЦ ИЗМЕНЕНИЙ ---

  // Роли Агентов
  await prisma.agentRole.create({
    data: { name: 'ADMIN' },
  });

  // Справочники для системы поддержки
  await prisma.ticketStatus.create({
    data: { name: 'OPEN' },
  });
  await prisma.ticketSource.create({
    data: { name: 'WEB_FORM' },
  });
  await prisma.senderType.create({
    data: { name: 'CLIENT' },
  });

  // --- ШАГ 3: УБРАЛИ СОЗДАНИЕ ТЕСТОВЫХ ДАННЫХ ---
  // Мы больше не создаем здесь админа или тестовые товары,
  // чтобы сид-скрипт отвечал только за "фундамент" (справочники).
  // Пользователей-администраторов мы создадим через сам сайт.

  console.log('🌱 СИДИНГ ФУНДАМЕНТА УСПЕШНО ЗАВЕРШЕН');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка во время сидинга:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
