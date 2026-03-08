import { renderHook, act, waitFor } from '@testing-library/react';
import { usePasskey } from '@/hooks/usePasskey';

// --- Mocks ---

const mockPasskeyLogin = jest.fn();
jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ passkeyLogin: mockPasskeyLogin }),
}));

const mockStartAuthentication = jest.fn();
jest.mock('@simplewebauthn/browser', () => ({
  startRegistration: jest.fn(),
  startAuthentication: (...args: unknown[]) => mockStartAuthentication(...args),
}));

const mockPasskeyLoginOptions = jest.fn();
jest.mock('@/lib/passkey-api', () => ({
  passkeyRegisterOptions: jest.fn(),
  passkeyRegisterVerify: jest.fn(),
  passkeyLoginOptions: (...args: unknown[]) => mockPasskeyLoginOptions(...args),
  listPasskeys: jest.fn().mockResolvedValue([]),
  renamePasskey: jest.fn(),
  deletePasskey: jest.fn(),
}));

// --- Helpers ---

function setupConditionalMediation(available: boolean) {
  Object.defineProperty(window, 'PublicKeyCredential', {
    value: {
      isConditionalMediationAvailable: jest.fn().mockResolvedValue(available),
    },
    writable: true,
    configurable: true,
  });
}

function removeConditionalMediation() {
  Object.defineProperty(window, 'PublicKeyCredential', {
    value: {},
    writable: true,
    configurable: true,
  });
}

function removePublicKeyCredential() {
  Object.defineProperty(window, 'PublicKeyCredential', {
    value: undefined,
    writable: true,
    configurable: true,
  });
}

// --- Tests ---

describe('usePasskey — Conditional UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    removePublicKeyCredential();
  });

  it('sets isConditionalAvailable = true when browser supports it', async () => {
    setupConditionalMediation(true);
    const { result } = renderHook(() => usePasskey());

    await waitFor(() => {
      expect(result.current.isConditionalAvailable).toBe(true);
    });
  });

  it('sets isConditionalAvailable = false when isConditionalMediationAvailable returns false', async () => {
    setupConditionalMediation(false);
    const { result } = renderHook(() => usePasskey());

    // Wait a tick for the async detection
    await waitFor(() => {
      expect(result.current.isConditionalAvailable).toBe(false);
    });
  });

  it('sets isConditionalAvailable = false when function does not exist', async () => {
    removeConditionalMediation();
    const { result } = renderHook(() => usePasskey());

    await waitFor(() => {
      expect(result.current.isConditionalAvailable).toBe(false);
    });
  });

  it('sets isConditionalAvailable = false when PublicKeyCredential is undefined', async () => {
    removePublicKeyCredential();
    const { result } = renderHook(() => usePasskey());

    await waitFor(() => {
      expect(result.current.isConditionalAvailable).toBe(false);
    });
  });

  it('startConditionalUI calls loginOptions without email and startAuthentication with useBrowserAutofill', async () => {
    setupConditionalMediation(true);
    const challengeId = 'challenge-123';
    const credential = { id: 'cred-1', response: {} };
    mockPasskeyLoginOptions.mockResolvedValue({ options: { challenge: 'abc' }, challengeId });
    mockStartAuthentication.mockResolvedValue(credential);
    mockPasskeyLogin.mockResolvedValue(undefined);

    const { result } = renderHook(() => usePasskey());
    await waitFor(() => expect(result.current.isConditionalAvailable).toBe(true));

    await act(async () => {
      await result.current.startConditionalUI();
    });

    expect(mockPasskeyLoginOptions).toHaveBeenCalledWith();
    expect(mockStartAuthentication).toHaveBeenCalledWith(
      expect.objectContaining({ useBrowserAutofill: true }),
    );
    expect(mockPasskeyLogin).toHaveBeenCalledWith(challengeId, credential);
  });

  it('startConditionalUI does nothing when isConditionalAvailable is false', async () => {
    setupConditionalMediation(false);
    const { result } = renderHook(() => usePasskey());
    await waitFor(() => expect(result.current.isConditionalAvailable).toBe(false));

    await act(async () => {
      await result.current.startConditionalUI();
    });

    expect(mockPasskeyLoginOptions).not.toHaveBeenCalled();
  });

  it('startConditionalUI silently handles AbortError', async () => {
    setupConditionalMediation(true);
    mockPasskeyLoginOptions.mockResolvedValue({ options: {}, challengeId: 'c1' });
    const abortError = new DOMException('Aborted', 'AbortError');
    mockStartAuthentication.mockRejectedValue(abortError);

    const { result } = renderHook(() => usePasskey());
    await waitFor(() => expect(result.current.isConditionalAvailable).toBe(true));

    // Should not throw
    await act(async () => {
      await result.current.startConditionalUI();
    });

    expect(mockPasskeyLogin).not.toHaveBeenCalled();
  });

  it('startConditionalUI silently handles NotAllowedError', async () => {
    setupConditionalMediation(true);
    mockPasskeyLoginOptions.mockResolvedValue({ options: {}, challengeId: 'c1' });
    const notAllowed = new DOMException('Not allowed', 'NotAllowedError');
    mockStartAuthentication.mockRejectedValue(notAllowed);

    const { result } = renderHook(() => usePasskey());
    await waitFor(() => expect(result.current.isConditionalAvailable).toBe(true));

    await act(async () => {
      await result.current.startConditionalUI();
    });

    expect(mockPasskeyLogin).not.toHaveBeenCalled();
  });

  it('abortConditionalUI cancels a pending conditional request', async () => {
    setupConditionalMediation(true);
    // Make startAuthentication hang forever (simulating waiting for user)
    mockPasskeyLoginOptions.mockResolvedValue({ options: {}, challengeId: 'c1' });
    mockStartAuthentication.mockImplementation(
      () => new Promise(() => {}), // never resolves
    );

    const { result } = renderHook(() => usePasskey());
    await waitFor(() => expect(result.current.isConditionalAvailable).toBe(true));

    // Start conditional UI (will hang on startAuthentication)
    let started = false;
    act(() => {
      result.current.startConditionalUI().then(() => {
        started = true;
      });
    });

    // Abort it
    act(() => {
      result.current.abortConditionalUI();
    });

    // passkeyLogin should never be called since we aborted
    expect(mockPasskeyLogin).not.toHaveBeenCalled();
    expect(started).toBe(false);
  });
});
