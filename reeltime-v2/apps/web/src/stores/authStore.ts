import { create } from 'zustand';
import { apiFetch, ApiError } from '../services/api';
import {
  setAccessToken,
  setRefreshToken,
  getAccessToken,
  getRefreshToken,
  clearTokens,
} from '../services/tokenService';

export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

interface AuthResponse {
  data: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };
}

interface MeResponse {
  data: User;
}

interface RefreshResponse {
  data: {
    accessToken: string;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const res = await apiFetch<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAccessToken(res.data.accessToken);
    setRefreshToken(res.data.refreshToken);
    set({ user: res.data.user, isAuthenticated: true });
  },

  register: async (email, password, name?) => {
    const body: Record<string, string> = { email, password };
    if (name) body.name = name;
    const res = await apiFetch<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    setAccessToken(res.data.accessToken);
    setRefreshToken(res.data.refreshToken);
    set({ user: res.data.user, isAuthenticated: true });
  },

  logout: () => {
    clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  refreshAuth: async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      set({ isLoading: false });
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL ?? '';
      const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        clearTokens();
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const json = (await res.json()) as RefreshResponse;
      setAccessToken(json.data.accessToken);

      // Fetch user profile
      const meRes = await apiFetch<MeResponse>('/api/v1/me');
      set({ user: meRes.data, isAuthenticated: true, isLoading: false });
    } catch {
      clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  initialize: async () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      set({ isLoading: false });
      return;
    }

    try {
      const meRes = await apiFetch<MeResponse>('/api/v1/me');
      set({ user: meRes.data, isAuthenticated: true, isLoading: false });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // Token expired, try refresh
        await get().refreshAuth();
      } else {
        clearTokens();
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    }
  },
}));

// Cross-tab sync: listen for storage changes
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'reeltime_access_token') {
      if (!e.newValue) {
        // Token was removed in another tab
        useAuthStore.setState({ user: null, isAuthenticated: false });
      } else {
        // Token was set in another tab, re-fetch user
        useAuthStore.getState().initialize();
      }
    }
  });
}
