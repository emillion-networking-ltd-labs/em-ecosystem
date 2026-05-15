import type { Request } from 'express';

const mockExistsSync = jest.fn();
const mockReadFileSync = jest.fn();
const mockAppendFileSync = jest.fn();

jest.mock('fs', () => ({
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
  appendFileSync: (...args: unknown[]) => mockAppendFileSync(...args),
}));

// eslint-disable-next-line import/first
import { OnlineMlScorerService } from '../online-ml-scorer.service';

const fakeReq = (path: string, ip = '10.0.0.42'): Request =>
  ({ path, method: 'GET', ip }) as unknown as Request;

describe('OnlineMlScorerService', () => {
  let service: OnlineMlScorerService;

  beforeEach(() => {
    mockExistsSync.mockReset();
    mockReadFileSync.mockReset();
    mockAppendFileSync.mockReset();
    mockExistsSync.mockReturnValue(true);
    delete process.env.SHADOW_LOG_PATH;
    delete process.env.ONLINE_FLAGS_PATH;
    service = new OnlineMlScorerService();
  });

  it('returns cap_disabled and writes nothing when ml_inference.enabled is false', () => {
    mockReadFileSync.mockReturnValue('ml_inference:\n  enabled: false\n');
    const r = service.score(fakeReq('/users/me'), 100, 200);
    expect(r.would_have_action).toBe('cap_disabled');
    expect(mockAppendFileSync).not.toHaveBeenCalled();
  });

  it('returns skipped_auth_path and writes nothing for /auth/* (AUTH-skip)', () => {
    mockReadFileSync.mockReturnValue('ml_inference:\n  enabled: true\n');
    const r = service.score(fakeReq('/auth/login'), 100, 200);
    expect(r.would_have_action).toBe('skipped_auth_path');
    expect(mockAppendFileSync).not.toHaveBeenCalled();
  });

  it('writes a valid shadow JSONL line when enabled and path is non-AUTH', () => {
    mockReadFileSync.mockReturnValue(
      'ml_inference:\n  enabled: true\nshadow_log_path: /tmp/test-shadow.jsonl\n',
    );
    service.score(fakeReq('/users/me'), 100, 200);
    expect(mockAppendFileSync).toHaveBeenCalledTimes(1);
    const [path, payload] = mockAppendFileSync.mock.calls[0];
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

  it('falls back to SHADOW_LOG_PATH env var when YAML omits shadow_log_path (OQ-1)', () => {
    mockReadFileSync.mockReturnValue('ml_inference:\n  enabled: true\n');
    process.env.SHADOW_LOG_PATH = '/tmp/env-fallback.jsonl';
    service.score(fakeReq('/users/me'), 100, 200);
    expect(mockAppendFileSync).toHaveBeenCalledTimes(1);
    const [path] = mockAppendFileSync.mock.calls[0];
    expect(path).toBe('/tmp/env-fallback.jsonl');
  });
});
