import { extractRequestMeta, RequestMeta } from '../request-meta';

describe('extractRequestMeta', () => {
  it('should return req.ip when available', () => {
    const req = {
      ip: '192.168.1.1',
      socket: { remoteAddress: '10.0.0.1' },
      headers: { 'user-agent': 'TestAgent/1.0' },
    };

    const result = extractRequestMeta(req);

    expect(result.ipAddress).toBe('192.168.1.1');
  });

  it('should fall back to req.socket.remoteAddress when req.ip is undefined', () => {
    const req = {
      socket: { remoteAddress: '10.0.0.1' },
      headers: { 'user-agent': 'TestAgent/1.0' },
    };

    const result = extractRequestMeta(req);

    expect(result.ipAddress).toBe('10.0.0.1');
  });

  it('should return "unknown" when neither req.ip nor req.socket.remoteAddress is available', () => {
    const req = {
      headers: { 'user-agent': 'TestAgent/1.0' },
    };

    const result = extractRequestMeta(req);

    expect(result.ipAddress).toBe('unknown');
  });

  it('should return user-agent header value', () => {
    const req = {
      ip: '127.0.0.1',
      headers: { 'user-agent': 'Mozilla/5.0' },
    };

    const result = extractRequestMeta(req);

    expect(result.userAgent).toBe('Mozilla/5.0');
  });

  it('should return null for userAgent when header is missing', () => {
    const req = {
      ip: '127.0.0.1',
      headers: {},
    };

    const result = extractRequestMeta(req);

    expect(result.userAgent).toBeNull();
  });

  it('should handle req.headers being undefined', () => {
    const req = {
      ip: '127.0.0.1',
    };

    const result = extractRequestMeta(req);

    expect(result.ipAddress).toBe('127.0.0.1');
    expect(result.userAgent).toBeNull();
  });

  it('should strip newline characters from user-agent header (CWE-117)', () => {
    const req = {
      ip: '127.0.0.1',
      headers: { 'user-agent': 'Mozilla/5.0\nINJECTED\r\nLINE' },
    };

    const result = extractRequestMeta(req);

    expect(result.userAgent).toBe('Mozilla/5.0INJECTEDLINE');
  });

  it('should strip carriage return from user-agent header', () => {
    const req = {
      ip: '127.0.0.1',
      headers: { 'user-agent': 'Agent\rEvil' },
    };

    const result = extractRequestMeta(req);

    expect(result.userAgent).toBe('AgentEvil');
  });

  it('should return correct RequestMeta type', () => {
    const req = {
      ip: '192.168.1.1',
      headers: { 'user-agent': 'TestAgent/1.0' },
    };

    const result: RequestMeta = extractRequestMeta(req);

    expect(result).toEqual({
      ipAddress: '192.168.1.1',
      userAgent: 'TestAgent/1.0',
    });
  });
});
