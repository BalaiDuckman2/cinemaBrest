import { prisma } from '../lib/prisma.js';
import type { Alert } from '../generated/prisma/index.js';
import type { CreateAlertInput, AlertCriteria } from '../schemas/alerteSchema.js';

export async function createAlert(
  userId: string,
  data: CreateAlertInput,
): Promise<Alert> {
  return prisma.alert.create({
    data: {
      userId,
      filmTitle: data.filmTitle,
      criteria: JSON.stringify(data.criteria ?? {}),
    },
  });
}

export async function getUserAlerts(userId: string): Promise<Alert[]> {
  return prisma.alert.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function deleteAlert(
  id: string,
  userId: string,
): Promise<boolean> {
  const result = await prisma.alert.deleteMany({
    where: { id, userId },
  });
  return result.count > 0;
}

export async function getActiveAlerts(): Promise<Alert[]> {
  return prisma.alert.findMany({
    where: { isActive: true },
  });
}

export async function markTriggered(
  id: string,
  triggeredAt: Date,
): Promise<Alert> {
  return prisma.alert.update({
    where: { id },
    data: { triggeredAt },
  });
}

export function parseCriteria(criteria: string): AlertCriteria {
  try {
    return JSON.parse(criteria) as AlertCriteria;
  } catch {
    return {};
  }
}
