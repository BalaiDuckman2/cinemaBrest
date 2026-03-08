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
  user: {
    profile: ['user', 'profile'] as const,
  },
  alerts: {
    all: ['alerts'] as const,
  },
} as const;
