import { getAccessToken, getRefreshToken, setAccessToken, clearTokens } from './tokenService';

const API_URL = import.meta.env.VITE_API_URL ?? '';

/** Error with structured API error info. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Array<{ path: string; message: string }>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function attemptTokenRefresh(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;

  isRefreshing = true;
  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return false;

      const json = await res.json();
      setAccessToken(json.data.accessToken);
      return true;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(init?.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (res.status === 401) {
    // Attempt token refresh and retry once
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      const newToken = getAccessToken();
      const retryHeaders: Record<string, string> = {
        ...headers,
        ...(newToken ? { Authorization: `Bearer ${newToken}` } : {}),
      };
      const retryRes = await fetch(`${API_URL}${path}`, { ...init, headers: retryHeaders });
      if (retryRes.ok) return retryRes.json() as Promise<T>;

      // Retry also failed
      const retryBody = await retryRes.json().catch(() => null);
      clearTokens();
      throw new ApiError(
        retryRes.status,
        retryBody?.error?.code ?? 'UNAUTHORIZED',
        retryBody?.error?.message ?? 'Session expiree',
      );
    }

    // Refresh failed
    clearTokens();
    const body = await res.json().catch(() => null);
    throw new ApiError(
      401,
      body?.error?.code ?? 'UNAUTHORIZED',
      body?.error?.message ?? 'Session expiree',
    );
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(
      res.status,
      body?.error?.code ?? 'UNKNOWN_ERROR',
      body?.error?.message ?? `Erreur ${res.status}`,
      body?.error?.details,
    );
  }

  return res.json() as Promise<T>;
}
