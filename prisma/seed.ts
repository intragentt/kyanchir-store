// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import {
  DEFAULT_DESIGN_SYSTEM_SETTINGS,
  DESIGN_SYSTEM_KEY,
} from '../src/lib/settings/design-system';

const prisma = new PrismaClient();

async function main() {
  // --- ШАГ 1: ПОЛНАЯ ОЧИСТКА (С УЧЕТОМ НОВОЙ СХЕМЫ) ---
  console.log('🧹 Очистка старых данных в правильном порядке...');

  // Сначала удаляем модели с наибольшим количеством внешних ключей
  await prisma.cartItem.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.address.deleteMany();
  await prisma.userMeasurements.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.loginToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany(); // Теперь можно удалять пользователей
  await prisma.userRole.deleteMany();

  await prisma.supportMessage.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.supportAgent.deleteMany();
  await prisma.agentRole.deleteMany();
  await prisma.ticketStatus.deleteMany();
  await prisma.ticketSource.deleteMany();
  await prisma.senderType.deleteMany();
  await prisma.supportRoute.deleteMany();

  await prisma.presetItem.deleteMany();
  await prisma.filterPreset.deleteMany();
  await prisma.presetItemType.deleteMany();

  await prisma.attribute.deleteMany();
  await prisma.alternativeName.deleteMany();
  await prisma.image.deleteMany();
  await prisma.productSize.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();

  await prisma.category.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.size.deleteMany();
  await prisma.status.deleteMany();
  await prisma.orderStatus.deleteMany();

  await prisma.categorySynonym.deleteMany();
  await prisma.codeRule.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.skuSequence.deleteMany();
  await prisma.temporaryReply.deleteMany();

  // --- ШАГ 2: СОЗДАНИЕ ФУНДАМЕНТА ---
  console.log('📚 Создание записей в справочниках...');

  console.log('   - Создание статусов продуктов...');
  await prisma.status.createMany({
    data: [{ name: 'DRAFT' }, { name: 'PUBLISHED' }, { name: 'ARCHIVED' }],
    skipDuplicates: true,
  });

  console.log('   - Создание ролей пользователей...');
  await prisma.userRole.createMany({
    data: [{ name: 'ADMIN' }, { name: 'MANAGEMENT' }, { name: 'USER' }],
    skipDuplicates: true,
  });

  console.log('   - Создание статусов заказов...');
  await prisma.orderStatus.createMany({
    data: [
      { name: 'PENDING' },
      { name: 'PROCESSING' },
      { name: 'SHIPPED' },
      { name: 'DELIVERED' },
      { name: 'CANCELLED' },
    ],
    skipDuplicates: true,
  });

  console.log('   - Создание ролей агентов поддержки...');
  await prisma.agentRole.createMany({
    data: [{ name: 'ADMIN' }, { name: 'AGENT' }],
    skipDuplicates: true,
  });

  console.log('   - Создание статусов тикетов...');
  await prisma.ticketStatus.createMany({
    data: [{ name: 'OPEN' }, { name: 'PENDING' }, { name: 'RESOLVED' }],
    skipDuplicates: true,
  });

  console.log('   - Создание источников тикетов...');
  await prisma.ticketSource.createMany({
    data: [{ name: 'WEB_FORM' }, { name: 'EMAIL' }, { name: 'TELEGRAM' }],
    skipDuplicates: true,
  });

  console.log('   - Создание типов отправителей...');
  await prisma.senderType.createMany({
    data: [{ name: 'CLIENT' }, { name: 'AGENT' }, { name: 'SYSTEM' }],
    skipDuplicates: true,
  });

  console.log('   - Инициализация дизайн-системы...');
  await prisma.systemSetting.upsert({
    where: { key: DESIGN_SYSTEM_KEY },
    update: { value: JSON.stringify(DEFAULT_DESIGN_SYSTEM_SETTINGS) },
    create: { key: DESIGN_SYSTEM_KEY, value: JSON.stringify(DEFAULT_DESIGN_SYSTEM_SETTINGS) },
  });

  console.log('✅ СИДИНГ ФУНДАМЕНТА УСПЕШНО ЗАВЕРШЕН');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка во время сидинга:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
