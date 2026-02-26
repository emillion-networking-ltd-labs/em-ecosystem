const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

let cachedCsrfToken: string | null = null;
let tokenFetchPromise: Promise<string | null> | null = null;

export async function getCsrfToken(): Promise<string | null> {
  if (cachedCsrfToken) return cachedCsrfToken;

  if (tokenFetchPromise) return tokenFetchPromise;

  tokenFetchPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/csrf-token`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) {
        console.error('Failed to fetch CSRF token:', res.status);
        return null;
      }

      const data = await res.json();
      cachedCsrfToken = data.csrfToken;
      return cachedCsrfToken;
    } catch (err) {
      console.error('Error fetching CSRF token:', err);
      return null;
    } finally {
      tokenFetchPromise = null;
    }
  })();

  return tokenFetchPromise;
}

export function clearCsrfToken(): void {
  cachedCsrfToken = null;
}

export function getCachedCsrfToken(): string | null {
  return cachedCsrfToken;
}
