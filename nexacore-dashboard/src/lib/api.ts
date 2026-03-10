import { getCsrfToken, clearCsrfToken } from './csrf';
import { DETECTION_CSRF_ERROR } from './error-constants';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const CSRF_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

class ApiClient {
  private accessToken: string | null = null;
  private refreshPromise: Promise<string | null> | null = null;
  private deviceFingerprint: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  clearAccessToken() {
    this.accessToken = null;
  }

  setDeviceFingerprint(fp: string | null) {
    this.deviceFingerprint = fp;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const method = (options.method || 'GET').toUpperCase();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.accessToken && { Authorization: `Bearer ${this.accessToken}` }),
      ...(this.deviceFingerprint && { 'X-Device-Fingerprint': this.deviceFingerprint }),
    };

    if (CSRF_METHODS.has(method)) {
      const csrfToken = await getCsrfToken();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    }

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        credentials: 'include',
        headers: { ...headers, ...(options.headers as Record<string, string>) },
      });
    } catch {
      throw {
        error: { message: 'Network error. Please check your connection.', code: 'NETWORK_ERROR', statusCode: 0 },
      };
    }

    // Handle 403 CSRF token errors — clear and retry once
    if (response.status === 403) {
      const body = await response.clone().json().catch(() => null);
      const csrfMsg = (body?.message || body?.error?.message || '').toLowerCase();
      if (csrfMsg.includes(DETECTION_CSRF_ERROR)) {
        clearCsrfToken();
        const newCsrfToken = await getCsrfToken();
        if (newCsrfToken) {
          headers['X-CSRF-Token'] = newCsrfToken;
          try {
            const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
              ...options,
              credentials: 'include',
              headers: { ...headers, ...(options.headers as Record<string, string>) },
            });
            if (!retryResponse.ok) {
              throw await this.parseErrorResponse(retryResponse);
            }
            return retryResponse.json();
          } catch (retryErr) {
            if ((retryErr as { error?: unknown })?.error) throw retryErr;
            throw {
              error: { message: 'Network error. Please check your connection.', code: 'NETWORK_ERROR', statusCode: 0 },
            };
          }
        }
      }
    }

    // Handle 401 with silent refresh
    if (response.status === 401 && this.accessToken) {
      const newToken = await this.silentRefresh();
      if (newToken) {
        headers.Authorization = `Bearer ${newToken}`;
        if (CSRF_METHODS.has(method)) {
          const csrfToken = await getCsrfToken();
          if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
          }
        }
        let retryResponse: Response;
        try {
          retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            credentials: 'include',
            headers: { ...headers, ...(options.headers as Record<string, string>) },
          });
        } catch {
          throw {
            error: { message: 'Network error. Please check your connection.', code: 'NETWORK_ERROR', statusCode: 0 },
          };
        }
        if (!retryResponse.ok) {
          throw await this.parseErrorResponse(retryResponse);
        }
        return retryResponse.json();
      }
    }

    if (!response.ok) {
      throw await this.parseErrorResponse(response);
    }

    return response.json();
  }

  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
  }

  put<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });
  }

  patch<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) });
  }

  delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  deleteWithBody<T>(endpoint: string, body: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE', body: JSON.stringify(body) });
  }

  private async parseErrorResponse(response: Response): Promise<unknown> {
    try {
      const body = await response.json();

      if (body?.error && response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        if (retryAfter && !body.error.retryAfter) {
          body.error.retryAfter = parseInt(retryAfter, 10);
        }
      }

      return body;
    } catch {
      return {
        error: {
          message: `Server error (${response.status})`,
          code: 'SERVER_ERROR',
          statusCode: response.status,
        },
      };
    }
  }

  private async silentRefresh(): Promise<string | null> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      try {
        const csrfToken = await getCsrfToken();
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {},
        });
        if (!res.ok) return null;
        const data = await res.json();
        this.accessToken = data.accessToken;
        return data.accessToken as string;
      } catch {
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }
}

export { API_BASE_URL };
export const apiClient = new ApiClient();
