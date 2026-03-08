import { useAuthStore } from '../../stores/useAuthStore';
import { apiClient } from '../../services/api';
import {
  setAccessToken,
  setRefreshToken,
  clearTokens,
  getAccessToken,
} from '../../services/secureStorage';

// Mock the API client
jest.mock('../../services/api', () => ({
  apiClient: jest.fn(),
  ApiError: class ApiError extends Error {
    status: number;
    code: string;
    constructor(status: number, code: string, message: string) {
      super(message);
      this.status = status;
      this.code = code;
    }
  },
}));

const mockApiClient = apiClient as jest.MockedFunction<typeof apiClient>;
const mockSetAccessToken = setAccessToken as jest.MockedFunction<typeof setAccessToken>;
const mockSetRefreshToken = setRefreshToken as jest.MockedFunction<typeof setRefreshToken>;
const mockClearTokens = clearTokens as jest.MockedFunction<typeof clearTokens>;
const mockGetAccessToken = getAccessToken as jest.MockedFunction<typeof getAccessToken>;

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: true,
    });
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('has null user', () => {
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('is not authenticated', () => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('is loading initially', () => {
      expect(useAuthStore.getState().isLoading).toBe(true);
    });
  });

  describe('login', () => {
    it('stores tokens and sets user on success', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: '2026-01-01',
      };

      mockApiClient.mockResolvedValueOnce({
        data: {
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-456',
          user: mockUser,
        },
      });

      await useAuthStore.getState().login('test@example.com', 'password123');

      expect(mockSetAccessToken).toHaveBeenCalledWith('access-token-123');
      expect(mockSetRefreshToken).toHaveBeenCalledWith('refresh-token-456');
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('calls API with correct parameters', async () => {
      mockApiClient.mockResolvedValueOnce({
        data: {
          accessToken: 'token',
          refreshToken: 'refresh',
          user: { id: '1', email: 'a@b.com', name: null, createdAt: '' },
        },
      });

      await useAuthStore.getState().login('a@b.com', 'pass');

      expect(mockApiClient).toHaveBeenCalledWith('/api/v1/auth/login', {
        method: 'POST',
        body: { email: 'a@b.com', password: 'pass' },
        skipAuth: true,
      });
    });

    it('propagates API errors', async () => {
      mockApiClient.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        useAuthStore.getState().login('test@example.com', 'wrong'),
      ).rejects.toThrow('Network error');

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('register', () => {
    it('stores tokens and sets user on success', async () => {
      const mockUser = {
        id: '2',
        email: 'new@example.com',
        name: 'New User',
        createdAt: '2026-01-01',
      };

      mockApiClient.mockResolvedValueOnce({
        data: {
          accessToken: 'new-access',
          refreshToken: 'new-refresh',
          user: mockUser,
        },
      });

      await useAuthStore.getState().register('new@example.com', 'password', 'New User');

      expect(mockSetAccessToken).toHaveBeenCalledWith('new-access');
      expect(mockSetRefreshToken).toHaveBeenCalledWith('new-refresh');
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('sends name as undefined when not provided', async () => {
      mockApiClient.mockResolvedValueOnce({
        data: {
          accessToken: 'token',
          refreshToken: 'refresh',
          user: { id: '1', email: 'a@b.com', name: null, createdAt: '' },
        },
      });

      await useAuthStore.getState().register('a@b.com', 'pass');

      expect(mockApiClient).toHaveBeenCalledWith('/api/v1/auth/register', {
        method: 'POST',
        body: { email: 'a@b.com', password: 'pass', name: undefined },
        skipAuth: true,
      });
    });
  });

  describe('logout', () => {
    it('clears tokens and resets state', async () => {
      // Set up authenticated state
      useAuthStore.setState({
        user: { id: '1', email: 'test@example.com', name: 'Test', createdAt: '' },
        isAuthenticated: true,
        isLoading: false,
      });

      await useAuthStore.getState().logout();

      expect(mockClearTokens).toHaveBeenCalled();
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('restoreSession', () => {
    it('sets isLoading false when no token exists', async () => {
      mockGetAccessToken.mockResolvedValueOnce(null);

      await useAuthStore.getState().restoreSession();

      expect(useAuthStore.getState().isLoading).toBe(false);
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('restores user when token is valid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test',
        createdAt: '2026-01-01',
      };

      mockGetAccessToken.mockResolvedValueOnce('valid-token');
      mockApiClient.mockResolvedValueOnce({ data: mockUser });

      await useAuthStore.getState().restoreSession();

      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });
});
