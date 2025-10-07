// Местоположение: src/lib/admin/users.ts
import 'server-only';

import { Prisma } from '@prisma/client';
import { createHash, decrypt } from '@/lib/encryption';
import prisma from '@/lib/prisma';

/**
 * 📊 Тип сортировки пользователей
 */
export type AdminUserSortKey =
  | 'createdAt'
  | 'role'
  | 'ordersCount'
  | 'totalSpent'
  | 'lastLoginAt';

/**
 * 👥 Возможные статусы пользователя в админке
 */
export type AdminUserStatus = 'active' | 'pending' | 'blocked';

/**
 * 🧮 Параметры фильтрации и пагинации
 */
export interface AdminUsersQuery {
  page?: number;
  perPage?: number;
  search?: string;
  role?: string;
  status?: string;
  sortBy?: AdminUserSortKey;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 📦 Ответ одной записи пользователя для клиентской таблицы
 */
export interface AdminUserRecord {
  id: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: AdminUserStatus;
  avatarUrl: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  ordersCount: number;
  totalSpent: number;
}

/**
 * 📈 Общая статистика по выборке пользователей
 */
export interface AdminUsersSummary {
  total: number;
  active: number;
  pending: number;
  admin: number;
}

/**
 * 🧾 Полный ответ сервиса пользователей
 */
export interface AdminUsersResult {
  users: AdminUserRecord[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  summary: AdminUsersSummary;
}

const ADMIN_ROLES = ['ADMIN', 'MANAGEMENT'];
const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 100;
const MAX_SAMPLE_FOR_NAME_SEARCH = 300;

function normalizeRole(role: string | undefined | null): string | undefined {
  if (!role || role === 'all') return undefined;
  return role.toUpperCase();
}

function determineStatus(user: {
  emailVerified: Date | null;
  passwordHash: string | null;
}): AdminUserStatus {
  if (!user.emailVerified) {
    return 'pending';
  }
  return 'active';
}

function safeDecrypt(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return decrypt(value);
  } catch (error) {
    console.error('❌ admin/users: ошибка дешифрования', error);
    return null;
  }
}

function buildOrderBy(
  sortBy: AdminUserSortKey,
  sortOrder: 'asc' | 'desc',
): Prisma.UserOrderByWithRelationInput | undefined {
  switch (sortBy) {
    case 'role':
      return { role: { name: sortOrder } } satisfies Prisma.UserOrderByWithRelationInput;
    case 'ordersCount':
      return { orders: { _count: sortOrder } } satisfies Prisma.UserOrderByWithRelationInput;
    case 'totalSpent':
      return undefined;
    case 'lastLoginAt':
      return undefined;
    case 'createdAt':
    default:
      return { createdAt: sortOrder } satisfies Prisma.UserOrderByWithRelationInput;
  }
}

function buildWhereClause(query: AdminUsersQuery): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};

  const normalizedRole = normalizeRole(query.role);
  if (normalizedRole) {
    where.role = { name: normalizedRole };
  }

  function appendAnd(clause: Prisma.UserWhereInput) {
    const current = where.AND;
    if (!current) {
      where.AND = [clause];
      return;
    }

    if (Array.isArray(current)) {
      where.AND = [...current, clause];
      return;
    }

    where.AND = [current, clause];
  }

  if (query.status && query.status !== 'all') {
    if (query.status === 'active') {
      where.emailVerified = { not: null };
    }
    if (query.status === 'pending') {
      where.emailVerified = null;
    }
    if (query.status === 'blocked') {
      appendAnd({
        sessions: { none: {} },
      });
    }
  }

  const searchTerm = query.search?.trim();
  if (searchTerm) {
    const normalized = searchTerm.toLowerCase();
    const orConditions: Prisma.UserWhereInput[] = [];

    if (normalized.includes('@')) {
      orConditions.push({ email_hash: createHash(normalized) });
    }

    if (/^\+?\d{3,}$/.test(normalized)) {
      orConditions.push({ phone: { contains: normalized.replace(/\s+/g, ''), mode: 'insensitive' } });
    }

    if (/^[a-z0-9-]{8,}$/i.test(normalized)) {
      orConditions.push({ id: normalized });
    }

    if (orConditions.length > 0) {
      appendAnd({ OR: orConditions });
    }
  }

  return where;
}

function filterByNameIfNeeded(
  records: AdminUserRecord[],
  searchTerm: string | undefined,
): AdminUserRecord[] {
  if (!searchTerm) {
    return records;
  }

  const normalized = searchTerm.trim().toLowerCase();
  if (!normalized || normalized.includes('@') || /^\+?\d/.test(normalized)) {
    return records;
  }

  return records.filter((record) =>
    record.fullName.toLowerCase().includes(normalized),
  );
}

function mapToAdminRecord(user: Prisma.UserGetPayload<{
  include: {
    role: true;
    orders: { select: { totalAmount: true } };
    _count: { select: { orders: true } };
    sessions: { select: { expires: true }; orderBy: { expires: 'desc' }; take: 1 };
  };
}>): AdminUserRecord {
  const firstName = safeDecrypt(user.name_encrypted);
  const lastName = safeDecrypt(user.surname_encrypted);
  const email = safeDecrypt(user.email_encrypted);
  const status = determineStatus({
    emailVerified: user.emailVerified,
    passwordHash: user.passwordHash,
  });
  const lastSession = user.sessions[0]?.expires ?? null;
  const totalSpent = user.orders.reduce((acc, order) => acc + order.totalAmount, 0) / 100;

  return {
    id: user.id,
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(' ').trim() || 'Без имени',
    email,
    phone: user.phone,
    role: user.role.name,
    status,
    avatarUrl: user.image ?? null,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: lastSession ? lastSession.toISOString() : null,
    ordersCount: user._count.orders,
    totalSpent,
  };
}

async function collectSummary(where: Prisma.UserWhereInput) {
  const [total, active, pending, admin] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.count({ where: { ...where, emailVerified: { not: null } } }),
    prisma.user.count({ where: { ...where, emailVerified: null } }),
    prisma.user.count({ where: { ...where, role: { name: { in: ADMIN_ROLES } } } }),
  ]);

  return { total, active, pending, admin } satisfies AdminUsersSummary;
}

export async function fetchAdminUsers(
  query: AdminUsersQuery = {},
): Promise<AdminUsersResult> {
  const page = Math.max(query.page ?? DEFAULT_PAGE, 1);
  const perPage = Math.min(query.perPage ?? DEFAULT_PER_PAGE, MAX_PER_PAGE);
  const sortBy = query.sortBy ?? 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
  const searchTerm = query.search?.trim();
  const isTotalSpentSort = sortBy === 'totalSpent';
  const isLastLoginSort = sortBy === 'lastLoginAt';
  const requiresManualSort = isTotalSpentSort || isLastLoginSort;

  console.log('🔄 admin/users: получение пользователей', {
    page,
    perPage,
    sortBy,
    sortOrder,
    searchTerm,
  });

  const where = buildWhereClause({ ...query, page, perPage, sortOrder });
  const orderBy = buildOrderBy(sortBy, sortOrder);

  const isNameSearch = Boolean(
    searchTerm &&
      !searchTerm.includes('@') &&
      !/^\+?\d/.test(searchTerm) &&
      !/^[a-z0-9-]{8,}$/i.test(searchTerm),
  );

  const skip = isNameSearch ? 0 : (page - 1) * perPage;
  const take = isNameSearch ? MAX_SAMPLE_FOR_NAME_SEARCH : perPage;

  let manualOrderBy: Prisma.UserOrderByWithRelationInput | undefined;
  if (requiresManualSort) {
    if (isTotalSpentSort) {
      console.log('🔄 admin/users: ручная сортировка по сумме покупок');
    }
    if (isLastLoginSort) {
      console.log('🔄 admin/users: ручная сортировка по последнему входу');
    }
    manualOrderBy = { createdAt: 'desc' } satisfies Prisma.UserOrderByWithRelationInput;
  }

  const [summary, rawUsers] = await Promise.all([
    collectSummary(where),
    prisma.user.findMany({
      where,
      include: {
        role: true,
        orders: { select: { totalAmount: true } },
        _count: { select: { orders: true } },
        sessions: { select: { expires: true }, orderBy: { expires: 'desc' }, take: 1 },
      },
      ...(requiresManualSort
        ? { orderBy: manualOrderBy }
        : {
            orderBy: orderBy ?? { createdAt: sortOrder },
            skip,
            take,
          }),
    }),
  ]);

  const mapped = rawUsers.map(mapToAdminRecord);
  const filteredByName = filterByNameIfNeeded(mapped, searchTerm);

  const manuallySorted = requiresManualSort
    ? [...filteredByName].sort((a, b) => {
        if (isTotalSpentSort) {
          return sortOrder === 'asc' ? a.totalSpent - b.totalSpent : b.totalSpent - a.totalSpent;
        }

        if (isLastLoginSort) {
          const aTime = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : null;
          const bTime = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : null;

          if (aTime === bTime) {
            return 0;
          }

          if (aTime === null) {
            return sortOrder === 'asc' ? -1 : 1;
          }

          if (bTime === null) {
            return sortOrder === 'asc' ? 1 : -1;
          }

          return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
        }

        return 0;
      })
    : filteredByName;

  const total = isNameSearch || requiresManualSort
    ? manuallySorted.length
    : await prisma.user.count({ where });

  const totalPages = Math.max(Math.ceil(total / perPage), 1);
  const start = (page - 1) * perPage;
  const paginated = isNameSearch || requiresManualSort
    ? manuallySorted.slice(start, start + perPage)
    : manuallySorted;

  console.log('✅ admin/users: пользователи загружены', {
    count: paginated.length,
    total,
  });

  return {
    users: paginated,
    page,
    perPage,
    total,
    totalPages,
    summary,
  };
}
