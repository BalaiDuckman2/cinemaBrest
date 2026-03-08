import { prisma } from '../lib/prisma.js';
import type { Watchlist } from '../generated/prisma/index.js';
import type { AddToWatchlistInput } from '../schemas/watchlistSchema.js';

export async function addToWatchlist(
  userId: string,
  data: AddToWatchlistInput,
): Promise<Watchlist> {
  return prisma.watchlist.create({
    data: {
      userId,
      filmTitle: data.filmTitle,
      cinemaName: data.cinemaName,
      date: data.date,
      time: data.time,
      version: data.version,
      bookingUrl: data.bookingUrl,
      posterUrl: data.posterUrl,
    },
  });
}

export async function getUserWatchlist(userId: string): Promise<Watchlist[]> {
  return prisma.watchlist.findMany({
    where: { userId },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
  });
}

export async function removeFromWatchlist(
  id: string,
  userId: string,
): Promise<boolean> {
  const result = await prisma.watchlist.deleteMany({
    where: { id, userId },
  });
  return result.count > 0;
}

export async function isInWatchlist(
  userId: string,
  filmTitle: string,
  cinemaName: string,
  date: string,
  time: string,
): Promise<boolean> {
  const item = await prisma.watchlist.findFirst({
    where: { userId, filmTitle, cinemaName, date, time },
    select: { id: true },
  });
  return item !== null;
}
