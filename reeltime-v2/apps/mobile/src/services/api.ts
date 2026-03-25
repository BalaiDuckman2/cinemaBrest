const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

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

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', headers = {}, body } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errorData: { code?: string; message?: string; details?: Array<{ path: string; message: string }> } = {};
    try {
      const json = (await response.json()) as {
        error?: typeof errorData;
        code?: string;
        message?: string;
        details?: Array<{ path: string; message: string }>;
      };
      errorData = json.error ?? json;
    } catch {
      // Response body may not be JSON
    }

    throw new ApiError(
      response.status,
      errorData.code ?? 'UNKNOWN_ERROR',
      errorData.message ?? `Erreur ${response.status}`,
      errorData.details,
    );
  }

  // 204 No Content has no body - return undefined
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
