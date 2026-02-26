const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ApiClient {
  private accessToken: string | null = null;
  private refreshPromise: Promise<string | null> | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  clearAccessToken() {
    this.accessToken = null;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.accessToken && { Authorization: `Bearer ${this.accessToken}` }),
    };

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: { ...headers, ...(options.headers as Record<string, string>) },
      });
    } catch {
      throw {
        error: { message: 'Network error. Please check your connection.', code: 'NETWORK_ERROR', statusCode: 0 },
      };
    }

    // Handle 401 with silent refresh
    if (response.status === 401 && this.accessToken) {
      const newToken = await this.silentRefresh();
      if (newToken) {
        headers.Authorization = `Bearer ${newToken}`;
        let retryResponse: Response;
        try {
          retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
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

  private async parseErrorResponse(response: Response): Promise<unknown> {
    try {
      const body = await response.json();

      // Enrich error with rate limit headers when present
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
        const res = await fetch('/api/auth/refresh', { method: 'POST' });
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

export const apiClient = new ApiClient();
