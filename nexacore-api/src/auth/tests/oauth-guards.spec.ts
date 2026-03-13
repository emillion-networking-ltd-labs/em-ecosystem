import { createOAuthAuthGuard } from '../guards/base-oauth-auth.guard';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { GitHubAuthGuard } from '../guards/github-auth.guard';
import { OAuthStateStore } from '../stores/oauth-state.store';

describe('OAuth Guards', () => {
  let stateStore: { generate: jest.Mock; validate: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
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

  describe('createOAuthAuthGuard factory', () => {
    it('should return a constructor function', () => {
      const Guard = createOAuthAuthGuard('test');
      expect(typeof Guard).toBe('function');
    });

    it('should return different classes for different strategy names', () => {
      const GuardA = createOAuthAuthGuard('strategyA');
      const GuardB = createOAuthAuthGuard('strategyB');
      expect(GuardA).not.toBe(GuardB);
    });

    it('should create an instance with getAuthenticateOptions method', () => {
      const Guard = createOAuthAuthGuard('test');
      const instance = new Guard(stateStore as unknown as OAuthStateStore);
      expect(typeof instance.getAuthenticateOptions).toBe('function');
    });
  });

  describe('GoogleAuthGuard', () => {
    let guard: InstanceType<typeof GoogleAuthGuard>;

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
    let guard: InstanceType<typeof GitHubAuthGuard>;

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
