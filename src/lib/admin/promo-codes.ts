import 'server-only';

import { z } from 'zod';
import prisma from '@/lib/prisma';
import { PromoCodeRewardType } from '@prisma/client';

const CODE_REGEX = /^[A-Z0-9_-]{3,32}$/i;

const createPromoCodeSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, 'Код должен содержать минимум 3 символа')
      .max(32, 'Код не должен превышать 32 символа')
      .regex(CODE_REGEX, 'Используйте только буквы, цифры, дефис и подчёркивание'),
    rewardType: z.nativeEnum(PromoCodeRewardType),
    discountValue: z.number().int().positive().max(1_000_000).optional(),
    bonusPoints: z.number().int().positive().max(1_000_000).optional(),
    usageLimit: z.number().int().positive().max(10_000).optional(),
    stackWithPoints: z.boolean().default(true).optional(),
    expiresAt: z.string().datetime().nullable().optional(),
    description: z.string().trim().max(280).optional(),
    isActive: z.boolean().optional().default(true),
  })
  .superRefine((value, ctx) => {
    if (value.rewardType === 'DISCOUNT') {
      if (value.discountValue === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Укажите сумму скидки',
          path: ['discountValue'],
        });
      }
      if (value.bonusPoints !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Для скидки бонусы не применяются',
          path: ['bonusPoints'],
        });
      }
    }

    if (value.rewardType === 'BONUS') {
      if (value.bonusPoints === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Укажите количество бонусных баллов',
          path: ['bonusPoints'],
        });
      }
      if (value.discountValue !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Для бонусного промокода скидка не задаётся',
          path: ['discountValue'],
        });
      }
    }
  });

export type CreatePromoCodeInput = z.infer<typeof createPromoCodeSchema>;

export async function createPromoCode(input: CreatePromoCodeInput) {
  const payload = createPromoCodeSchema.parse(input);

  const code = payload.code.toUpperCase();

  const expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : null;

  const promoCode = await prisma.promoCode.create({
    data: {
      code,
      rewardType: payload.rewardType,
      discountValue: payload.rewardType === 'DISCOUNT' ? payload.discountValue ?? null : null,
      bonusPoints: payload.rewardType === 'BONUS' ? payload.bonusPoints ?? null : null,
      usageLimit: payload.usageLimit ?? null,
      stackWithPoints: payload.stackWithPoints ?? true,
      expiresAt,
      description: payload.description?.trim() || null,
      isActive: payload.isActive ?? true,
    },
  });

  return promoCode;
}
