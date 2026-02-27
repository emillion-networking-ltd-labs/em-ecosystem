import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { GitHubAuthGuard } from '../guards/github-auth.guard';
import { OAuthStateStore } from '../stores/oauth-state.store';

describe('OAuth Guards — getAuthenticateOptions', () => {
  let stateStore: { generate: jest.Mock; validate: jest.Mock };

  beforeEach(() => {
    stateStore = {
      generate: jest.fn().mockReturnValue('random-state-value'),
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

    it('should return state when initiating OAuth (no code in query)', () => {
      const context = createMockContext({});

      const options = guard.getAuthenticateOptions(context);

      expect(options).toEqual({ state: 'random-state-value' });
      expect(stateStore.generate).toHaveBeenCalled();
    });

    it('should return empty options on callback (code present in query)', () => {
      const context = createMockContext({ code: 'auth-code-123' });

      const options = guard.getAuthenticateOptions(context);

      expect(options).toEqual({});
      expect(stateStore.generate).not.toHaveBeenCalled();
    });
  });

  describe('GitHubAuthGuard', () => {
    let guard: GitHubAuthGuard;

    beforeEach(() => {
      guard = new GitHubAuthGuard(stateStore as unknown as OAuthStateStore);
    });

    it('should return state when initiating OAuth (no code in query)', () => {
      const context = createMockContext({});

      const options = guard.getAuthenticateOptions(context);

      expect(options).toEqual({ state: 'random-state-value' });
      expect(stateStore.generate).toHaveBeenCalled();
    });

    it('should return empty options on callback (code present in query)', () => {
      const context = createMockContext({ code: 'auth-code-123' });

      const options = guard.getAuthenticateOptions(context);

      expect(options).toEqual({});
      expect(stateStore.generate).not.toHaveBeenCalled();
    });
  });
});
