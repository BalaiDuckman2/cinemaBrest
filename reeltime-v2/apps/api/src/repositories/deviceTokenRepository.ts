import { prisma } from '../lib/prisma.js';
import type { DeviceToken } from '../generated/prisma/index.js';

export async function registerToken(
  userId: string,
  token: string,
  platform: string,
): Promise<DeviceToken> {
  // Upsert: if token already exists, update userId and platform
  return prisma.deviceToken.upsert({
    where: { token },
    update: { userId, platform, updatedAt: new Date() },
    create: { userId, token, platform },
  });
}

export async function getTokensByUserId(userId: string): Promise<DeviceToken[]> {
  return prisma.deviceToken.findMany({
    where: { userId },
  });
}

export async function deleteToken(id: string): Promise<boolean> {
  const result = await prisma.deviceToken.deleteMany({
    where: { id },
  });
  return result.count > 0;
}

export async function deleteTokenByValue(token: string): Promise<void> {
  await prisma.deviceToken.deleteMany({
    where: { token },
  });
}

export async function deleteUserToken(
  id: string,
  userId: string,
): Promise<boolean> {
  const result = await prisma.deviceToken.deleteMany({
    where: { id, userId },
  });
  return result.count > 0;
}
