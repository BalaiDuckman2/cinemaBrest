import { prisma } from '../lib/prisma.js';
import type { User } from '../generated/prisma/index.js';

export async function findByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export async function findById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export async function create(data: {
  email: string;
  passwordHash: string;
  name?: string;
}): Promise<User> {
  return prisma.user.create({ data });
}

/**
 * Delete a user and all associated data (RGPD right to erasure).
 * Cascade deletes are configured in the Prisma schema (onDelete: Cascade)
 * for Watchlist, Alert, and DeviceToken relations.
 */
export async function deleteWithCascade(userId: string): Promise<void> {
  await prisma.user.delete({ where: { id: userId } });
}
