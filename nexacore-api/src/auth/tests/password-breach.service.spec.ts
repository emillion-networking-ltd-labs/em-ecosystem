import { Test, TestingModule } from '@nestjs/testing';
import { PasswordBreachService } from '../password-breach.service';

describe('PasswordBreachService', () => {
  let service: PasswordBreachService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordBreachService],
    }).compile();

    service = module.get<PasswordBreachService>(PasswordBreachService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // SHA-1 of "password" = 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
  // prefix = 5BAA6, suffix = 1E4C9B93F3F0682250B6CF8331B7EE68FD8

  it('should return true when password is found in breach database', async () => {
    const mockResponse = [
      '1D2DA4053E34E76F6576ED1DA63134B5E2A:3',
      '1E4C9B93F3F0682250B6CF8331B7EE68FD8:3861493',
      '1F2B668E8AABEF1C59E9EC6F82E3F3CD786:1',
    ].join('\n');

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => mockResponse,
    });

    const result = await service.isBreached('password');

    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.pwnedpasswords.com/range/5BAA6',
      expect.objectContaining({
        headers: { 'User-Agent': 'NexaCoreAPI-PasswordCheck' },
      }),
    );
  });

  it('should return false when password is NOT in breach database', async () => {
    const mockResponse = [
      '1D2DA4053E34E76F6576ED1DA63134B5E2A:3',
      'AAAAABBBBCCCCDDDDEEEEFFFF0000011111:1',
    ].join('\n');

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => mockResponse,
    });

    const result = await service.isBreached('password');

    expect(result).toBe(false);
  });

  it('should return false (fail-open) on API timeout', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(() => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new DOMException('Aborted', 'AbortError')), 10);
      });
    });

    const result = await service.isBreached('password');

    expect(result).toBe(false);
  });

  it('should return false (fail-open) on API 5xx error', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    const result = await service.isBreached('password');

    expect(result).toBe(false);
  });

  it('should return false (fail-open) on network error', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockRejectedValue(new TypeError('Failed to fetch'));

    const result = await service.isBreached('password');

    expect(result).toBe(false);
  });

  it('should return false on malformed API response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => 'this is not a valid response format',
    });

    const result = await service.isBreached('password');

    expect(result).toBe(false);
  });

  it('should send exactly 5-char SHA-1 prefix to API', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => '',
    });

    await service.isBreached('test-password');

    const url = fetchSpy.mock.calls[0][0] as string;
    const prefix = url.replace('https://api.pwnedpasswords.com/range/', '');

    expect(prefix).toHaveLength(5);
    expect(prefix).toMatch(/^[0-9A-F]{5}$/);
  });

  it('should handle empty password gracefully', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => '',
    });

    const result = await service.isBreached('');

    expect(result).toBe(false);
  });
});
