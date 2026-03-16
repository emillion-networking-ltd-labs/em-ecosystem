import { OAuthStateStore } from '../stores/oauth-state.store';

interface OAuthClient {
  getOAuthAccessToken: (
    code: string,
    params: Record<string, string>,
    callback: (...args: unknown[]) => void,
  ) => void;
}

export async function applyPkceAuthenticate(
  strategy: { _oauth2: OAuthClient },
  oauthStateStore: OAuthStateStore,
  req: { query?: { code?: string; state?: string } },
  options: Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  superAuthenticate: (...args: any[]) => void,
): Promise<void> {
  if (req.query?.code && req.query?.state) {
    const codeVerifier = await oauthStateStore.getCodeVerifier(req.query.state);
    if (codeVerifier) {
      const oauth2 = strategy._oauth2;
      const originalFn = oauth2.getOAuthAccessToken;
      oauth2.getOAuthAccessToken = function (
        code: string,
        params: Record<string, string>,
        callback: (...args: unknown[]) => void,
      ) {
        params.code_verifier = codeVerifier;
        oauth2.getOAuthAccessToken = originalFn; // restore immediately
        return originalFn.call(oauth2, code, params, callback);
      };
    }
  }
  return superAuthenticate.call(strategy, req, options);
}

export function applyPkceAuthorizationParams(
  options: Record<string, string>,
  baseParams: Record<string, string> = {},
): Record<string, string> {
  const params = { ...baseParams };
  if (options.code_challenge) {
    params.code_challenge = options.code_challenge;
    params.code_challenge_method = options.code_challenge_method || 'S256';
  }
  return params;
}
