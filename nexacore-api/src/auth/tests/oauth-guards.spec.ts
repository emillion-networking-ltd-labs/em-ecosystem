import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { GitHubAuthGuard } from '../guards/github-auth.guard';
import { OAuthStateStore } from '../stores/oauth-state.store';

describe('OAuth Guards — getAuthenticateOptions', () => {
  let stateStore: { generate: jest.Mock; validate: jest.Mock };

  beforeEach(() => {
    stateStore = {
      generate: jest.fn().mockResolvedValue({
        state: 'random-state-value',
        codeChallenge: 'mock-code-challenge',
      }),
      validate: jest.fn(),
    };
  });

  const createMockContext = (query: Record<string, string> = {}) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ query }),
      }),
    }) as any;

  describe('GoogleAuthGuard', () => {
    let guard: GoogleAuthGuard;

    beforeEach(() => {
      guard = new GoogleAuthGuard(stateStore as unknown as OAuthStateStore);
    });

    it('should return state when initiating OAuth (no code in query)', async () => {
      const context = createMockContext({});

      const options = await guard.getAuthenticateOptions(context);

      expect(options).toEqual({
        state: 'random-state-value',
        code_challenge: 'mock-code-challenge',
        code_challenge_method: 'S256',
      });
      expect(stateStore.generate).toHaveBeenCalled();
    });

    it('should return empty options on callback (code present in query)', async () => {
      const context = createMockContext({ code: 'auth-code-123' });

      const options = await guard.getAuthenticateOptions(context);

      expect(options).toEqual({});
      expect(stateStore.generate).not.toHaveBeenCalled();
    });
  });

  describe('GitHubAuthGuard', () => {
    let guard: GitHubAuthGuard;

    beforeEach(() => {
      guard = new GitHubAuthGuard(stateStore as unknown as OAuthStateStore);
    });

    it('should return state when initiating OAuth (no code in query)', async () => {
      const context = createMockContext({});

      const options = await guard.getAuthenticateOptions(context);

      expect(options).toEqual({
        state: 'random-state-value',
        code_challenge: 'mock-code-challenge',
        code_challenge_method: 'S256',
      });
      expect(stateStore.generate).toHaveBeenCalled();
    });

    it('should return empty options on callback (code present in query)', async () => {
      const context = createMockContext({ code: 'auth-code-123' });

      const options = await guard.getAuthenticateOptions(context);

      expect(options).toEqual({});
      expect(stateStore.generate).not.toHaveBeenCalled();
    });
  });
});
