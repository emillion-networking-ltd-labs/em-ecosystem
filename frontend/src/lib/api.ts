import { API_BASE_URL } from "./constants";
import type { ApiError } from "./types";

class ApiClient {
  private accessToken: string | null = null;
  private refreshPromise: Promise<string | null> | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  getAccessToken() {
    return this.accessToken;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && this.accessToken) {
      const newToken = await this.silentRefresh();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
        if (!retryResponse.ok) throw await this.parseError(retryResponse);
        return retryResponse.json();
      }
      throw {
        success: false,
        error: { message: "Session expired", code: "UNAUTHORIZED", statusCode: 401 },
      } as ApiError;
    }

    if (!response.ok) throw await this.parseError(response);
    return response.json();
  }

  async silentRefresh(): Promise<string | null> {
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = fetch("/api/auth/refresh", { method: "POST" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        this.refreshPromise = null;
        if (data?.accessToken) {
          this.accessToken = data.accessToken;
          return data.accessToken as string;
        }
        return null;
      })
      .catch(() => {
        this.refreshPromise = null;
        return null;
      });

    return this.refreshPromise;
  }

  private async parseError(response: Response): Promise<ApiError> {
    try {
      const body = await response.json();
      if (body?.error) return body as ApiError;
      return {
        success: false,
        error: {
          message: body?.message || response.statusText,
          code: "UNKNOWN",
          statusCode: response.status,
        },
      };
    } catch {
      return {
        success: false,
        error: {
          message: "Network error",
          code: "NETWORK_ERROR",
          statusCode: 0,
        },
      };
    }
  }
}

export const apiClient = new ApiClient();
