import type { Request } from 'express';

const mockExistsSync = jest.fn();
const mockReadFileSync = jest.fn();
const mockAppendFile = jest.fn();

jest.mock('fs', () => ({
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
}));

jest.mock('fs/promises', () => ({
  appendFile: (...args: unknown[]) => mockAppendFile(...args),
}));

import { OnlineMlScorerService } from '../online-ml-scorer.service';

const fakeReq = (path: string, ip = '10.0.0.42'): Request =>
  ({ path, method: 'GET', ip }) as unknown as Request;

const fakeReqWithUser = (path: string, userId: string): Request =>
  ({
    path,
    method: 'GET',
    ip: '10.0.0.42',
    user: { id: userId },
  }) as unknown as Request;

const fakeReqWithSession = (path: string, correlationId: string): Request =>
  ({
    path,
    method: 'GET',
    ip: '10.0.0.42',
    correlationId,
  }) as unknown as Request;

// Flush microtasks so fire-and-forget appendFile resolves before assertions.
const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('OnlineMlScorerService', () => {
  let service: OnlineMlScorerService;

  beforeEach(() => {
    mockExistsSync.mockReset();
    mockReadFileSync.mockReset();
    mockAppendFile.mockReset();
    mockAppendFile.mockResolvedValue(undefined);
    mockExistsSync.mockReturnValue(true);
    delete process.env.SHADOW_LOG_PATH;
    delete process.env.ONLINE_FLAGS_PATH;
    delete process.env.SHADOW_LOG_VALIDATE;
    delete process.env.SHADOW_LOG_SCHEMA_PATH;
    service = new OnlineMlScorerService();
  });

  it('returns cap_disabled and writes nothing when ml_inference.enabled is false', async () => {
    mockReadFileSync.mockReturnValue('ml_inference:\n  enabled: false\n');
    const r = service.score(fakeReq('/users/me'), 100, 200);
    await flush();
    expect(r.would_have_action).toBe('cap_disabled');
    expect(mockAppendFile).not.toHaveBeenCalled();
  });

  it('returns skipped_auth_path and writes nothing for /auth/* (AUTH-skip)', async () => {
    mockReadFileSync.mockReturnValue('ml_inference:\n  enabled: true\n');
    const r = service.score(fakeReq('/auth/login'), 100, 200);
    await flush();
    expect(r.would_have_action).toBe('skipped_auth_path');
    expect(mockAppendFile).not.toHaveBeenCalled();
  });

  it('writes a valid shadow JSONL line when enabled and path is non-AUTH', async () => {
    mockReadFileSync.mockReturnValue(
      'ml_inference:\n  enabled: true\nshadow_log_path: /tmp/test-shadow.jsonl\n',
    );
    service.score(fakeReq('/users/me'), 100, 200);
    await flush();
    expect(mockAppendFile).toHaveBeenCalledTimes(1);
    const [path, payload] = mockAppendFile.mock.calls[0];
    expect(path).toBe('/tmp/test-shadow.jsonl');
    const line = JSON.parse((payload as string).trim());
    expect(line).toMatchObject({
      cap: 'ml_inference',
      shadow_mode: true,
      request_path: '/users/me',
      request_method: 'GET',
    });
    expect(line.ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(['allowed', 'would_deny']).toContain(line.decision);
    expect(typeof line.would_have_action).toBe('string');
  });

  it('falls back to SHADOW_LOG_PATH env var when YAML omits shadow_log_path (OQ-1)', async () => {
    mockReadFileSync.mockReturnValue('ml_inference:\n  enabled: true\n');
    process.env.SHADOW_LOG_PATH = '/tmp/env-fallback.jsonl';
    service.score(fakeReq('/users/me'), 100, 200);
    await flush();
    expect(mockAppendFile).toHaveBeenCalledTimes(1);
    const [path] = mockAppendFile.mock.calls[0];
    expect(path).toBe('/tmp/env-fallback.jsonl');
  });

  // ── SCRUM-464 T-4 — Added tests ──────────────────────────────────────────

  it('computes z-score over rolling cohort and reports cohort_size correctly (cohort >1)', async () => {
    mockReadFileSync.mockReturnValue('ml_inference:\n  enabled: true\n');
    const correlationId = 'cohort-test-session';
    // Build a cohort of 5 baseline calls (durationMs ~100ms).
    for (let i = 0; i < 5; i++) {
      service.score(
        fakeReqWithSession('/users/me', correlationId),
        100 + i,
        200,
      );
    }
    await flush();
    // 6th call: outlier (much higher duration). z-score should be high.
    const r = service.score(
      fakeReqWithSession('/users/me', correlationId),
      5000, // 50x baseline → high z-score
      200,
    );
    await flush();
    expect(r.score).toBeGreaterThan(0.5);
    expect(mockAppendFile).toHaveBeenCalledTimes(6);
    const lastCall = mockAppendFile.mock.calls[5];
    const lastLine = JSON.parse((lastCall[1] as string).trim());
    expect(lastLine.metadata.cohort_size).toBe(6);
    expect(lastLine.target.kind).toBe('session');
  });

  it('emits correct target.kind/value/id_form for user, session, and ip variants', async () => {
    mockReadFileSync.mockReturnValue('ml_inference:\n  enabled: true\n');

    // Variant 1: user.id present → target.kind === 'user', id_form === 'sha256_12'
    service.score(fakeReqWithUser('/users/me', 'user-abc'), 100, 200);
    await flush();
    let line = JSON.parse((mockAppendFile.mock.calls[0][1] as string).trim());
    expect(line.target.kind).toBe('user');
    expect(line.target.id_form).toBe('sha256_12');
    // value must be the substring after the first ':' (T-3-prop verification: non-empty hash).
    expect(line.target.value).toMatch(/^[a-f0-9]{12}$/);

    // Variant 2: correlationId only → target.kind === 'session'
    service.score(fakeReqWithSession('/users/me', 'corr-xyz'), 100, 200);
    await flush();
    line = JSON.parse((mockAppendFile.mock.calls[1][1] as string).trim());
    expect(line.target.kind).toBe('session');
    expect(line.target.id_form).toBe('sha256_12');
    expect(line.target.value).toMatch(/^[a-f0-9]{12}$/);

    // Variant 3: only ip → target.kind === 'ip', id_form === 'ip_24', CIDR-shaped value.
    service.score(fakeReq('/users/me', '203.0.113.42'), 100, 200);
    await flush();
    line = JSON.parse((mockAppendFile.mock.calls[2][1] as string).trim());
    expect(line.target.kind).toBe('ip');
    expect(line.target.id_form).toBe('ip_24');
    expect(line.target.value).toBe('203.0.113.0/24');
    expect(line.target.value).not.toBe(''); // T-3-prop regression guard
  });

  it('fails open on malformed flags YAML — does not throw, treats cap as disabled', async () => {
    // Malformed YAML triggers js-yaml parse error inside reloadFlagsIfStale().
    mockReadFileSync.mockReturnValue('foo: [unclosed');
    let result: { score: number; would_have_action: string } | undefined;
    expect(() => {
      result = service.score(fakeReq('/users/me'), 100, 200);
    }).not.toThrow();
    await flush();
    // With flags unparsed, ml_inference.enabled is undefined → cap_disabled return path.
    expect(result?.would_have_action).toBe('cap_disabled');
    expect(mockAppendFile).not.toHaveBeenCalled();
  });
});
