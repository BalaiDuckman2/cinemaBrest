import { create } from 'zustand';
import { apiClient, ApiError } from '../services/api';
import {
  setAccessToken,
  setRefreshToken,
  getAccessToken,
  getRefreshToken,
  clearTokens,
} from '../services/secureStorage';
import { registerAndSendPushToken } from '../services/pushNotifications';

interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthResponse {
  data: AuthTokens & { user: User };
}

interface RefreshResponse {
  data: { accessToken: string };
}

interface ProfileResponse {
  data: User;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const response = await apiClient<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: { email, password },
      skipAuth: true,
    });

    await setAccessToken(response.data.accessToken);
    await setRefreshToken(response.data.refreshToken);
    set({ user: response.data.user, isAuthenticated: true });

    // Non-blocking push token registration
    registerAndSendPushToken().catch(() => {});
  },

  register: async (email, password, name?) => {
    const response = await apiClient<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: { email, password, name: name || undefined },
      skipAuth: true,
    });

    await setAccessToken(response.data.accessToken);
    await setRefreshToken(response.data.refreshToken);
    set({ user: response.data.user, isAuthenticated: true });

    // Non-blocking push token registration
    registerAndSendPushToken().catch(() => {});
  },

  logout: async () => {
    await clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  restoreSession: async () => {
    set({ isLoading: true });

    const accessToken = await getAccessToken();
    if (!accessToken) {
      set({ isLoading: false });
      return;
    }

    try {
      // Try fetching profile with current token
      const profile = await apiClient<ProfileResponse>('/api/v1/me');
      set({ user: profile.data, isAuthenticated: true, isLoading: false });
    } catch (err) {
      // If 401, try refresh
      if (err instanceof ApiError && err.status === 401) {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          await clearTokens();
          set({ isLoading: false });
          return;
        }

        try {
          const refreshResponse = await apiClient<RefreshResponse>(
            '/api/v1/auth/refresh',
            {
              method: 'POST',
              body: { refreshToken },
              skipAuth: true,
            },
          );
          await setAccessToken(refreshResponse.data.accessToken);

          const profile = await apiClient<ProfileResponse>('/api/v1/me');
          set({ user: profile.data, isAuthenticated: true, isLoading: false });
        } catch {
          await clearTokens();
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        // Network error or other - silently fall back to visitor
        await clearTokens();
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    }
  },
}));
