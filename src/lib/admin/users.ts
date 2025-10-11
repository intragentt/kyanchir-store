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
  /**
   * 🔢 Человеко-понятный идентификатор для отображения в таблице
   */
  displayId: string;
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
  /**
   * 🎁 Накопленные бонусные ("конусные") баллы
   */
  bonusPoints: number;
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

const DISPLAY_ID_SECTION_LENGTH = 4;

function buildDisplayId(userId: string): string {
  const normalized = userId?.trim() ?? '';

  if (!normalized) {
    return 'UNKNOWN';
  }

  const alphanumeric = normalized.replace(/[^a-zA-Z0-9]/g, '');
  const source = alphanumeric || normalized;

  if (source.length <= DISPLAY_ID_SECTION_LENGTH * 2) {
    return source.toUpperCase();
  }

  const prefix = source.slice(0, DISPLAY_ID_SECTION_LENGTH);
  const suffix = source.slice(-DISPLAY_ID_SECTION_LENGTH);

  return `${prefix}-${suffix}`.toUpperCase();
}

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

function appendAndCondition(
  where: Prisma.UserWhereInput,
  condition: Prisma.UserWhereInput,
) {
  const existingConditions = Array.isArray(where.AND)
    ? where.AND
    : where.AND
      ? [where.AND]
      : [];

  where.AND = [...existingConditions, condition];
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

  if (query.status && query.status !== 'all') {
    if (query.status === 'active') {
      where.emailVerified = { not: null };
    }
    if (query.status === 'pending') {
      where.emailVerified = null;
    }
    if (query.status === 'blocked') {
      appendAndCondition(where, {
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
      appendAndCondition(where, { OR: orConditions });
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
    displayId: buildDisplayId(user.id),
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
    bonusPoints: user.bonusPoints ?? 0,
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

  console.log('🔄 admin/users: получение пользователей', {
    page,
    perPage,
    sortBy,
    sortOrder,
    searchTerm,
  });

  const where = buildWhereClause({ ...query, page, perPage, sortOrder });
  const orderBy = buildOrderBy(sortBy, sortOrder);
  const requiresManualTotalSpentSort = sortBy === 'totalSpent';
  const requiresManualLastLoginSort = sortBy === 'lastLoginAt';
  const requiresManualSort = requiresManualTotalSpentSort || requiresManualLastLoginSort;

  const isNameSearch = Boolean(
    searchTerm &&
      !searchTerm.includes('@') &&
      !/^\+?\d/.test(searchTerm) &&
      !/^[a-z0-9-]{8,}$/i.test(searchTerm),
  );

  const skip = isNameSearch || requiresManualSort ? 0 : (page - 1) * perPage;
  const take = isNameSearch
    ? MAX_SAMPLE_FOR_NAME_SEARCH
    : requiresManualSort
      ? undefined
      : perPage;

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
      ...(orderBy ? { orderBy } : {}),
      ...(skip ? { skip } : {}),
      ...(typeof take === 'number' ? { take } : {}),
    }),
  ]);

  const mapped = rawUsers.map(mapToAdminRecord);
  const filteredByName = filterByNameIfNeeded(mapped, searchTerm);
  const manuallySorted = requiresManualSort
    ? [...filteredByName].sort((a, b) => {
        if (sortBy === 'totalSpent') {
          return sortOrder === 'asc' ? a.totalSpent - b.totalSpent : b.totalSpent - a.totalSpent;
        }

        const aTime = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : Number.NEGATIVE_INFINITY;
        const bTime = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : Number.NEGATIVE_INFINITY;
        return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
      })
    : filteredByName;

  const total = isNameSearch
    ? filteredByName.length
    : await prisma.user.count({ where });

  const totalPages = Math.max(Math.ceil(total / perPage), 1);
  const start = (page - 1) * perPage;
  const paginated = (isNameSearch || requiresManualSort
    ? manuallySorted.slice(start, start + perPage)
    : manuallySorted) satisfies AdminUserRecord[];

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

interface UpdateUserRoleParams {
  userId: string;
  roleName: string;
}

export async function updateUserRoleByAdmin({ userId, roleName }: UpdateUserRoleParams) {
  const normalizedRole = roleName.trim().toUpperCase();

  const role = await prisma.userRole.findUnique({
    where: { name: normalizedRole },
  });

  if (!role) {
    throw new Error('Роль не найдена');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { roleId: role.id },
  });
}

export async function deleteUserByAdmin(userId: string) {
  await prisma.user.delete({
    where: { id: userId },
  });
}
