export const queryKeys = {
  films: {
    all: ['films'] as const,
    week: (offset: number) => ['films', 'week', offset] as const,
    detail: (id: string) => ['films', 'detail', id] as const,
  },
  cinemas: {
    all: ['cinemas'] as const,
    detail: (id: string) => ['cinemas', 'detail', id] as const,
  },
  watchlist: {
    all: ['watchlist'] as const,
  },
  alertes: {
    all: ['alertes'] as const,
  },
  auth: {
    me: ['auth', 'me'] as const,
  },
} as const;
