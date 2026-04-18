import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LocalStorageProvider } from '../local-storage.provider';

jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  unlink: jest.fn().mockResolvedValue(undefined),
}));

import * as fs from 'fs/promises';

describe('LocalStorageProvider', () => {
  let provider: LocalStorageProvider;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStorageProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('./test-uploads'),
          },
        },
      ],
    }).compile();

    provider = module.get<LocalStorageProvider>(LocalStorageProvider);
  });

  describe('upload', () => {
    it('should create directory, write file, and return public URL', async () => {
      const buffer = Buffer.from('test-image-data');
      const key = 'user-123-avatar.jpg';

      const result = await provider.upload(buffer, key);

      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('avatars'),
        { recursive: true },
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(key),
        buffer,
      );
      expect(result).toBe('/uploads/avatars/user-123-avatar.jpg');
    });
  });

  describe('delete', () => {
    it('should unlink the file', async () => {
      await provider.delete('user-123-avatar.jpg');

      expect(fs.unlink).toHaveBeenCalledWith(
        expect.stringContaining('user-123-avatar.jpg'),
      );
    });

    it('should not throw when file does not exist', async () => {
      (fs.unlink as jest.Mock).mockRejectedValue(
        new Error('ENOENT: no such file'),
      );

      await expect(provider.delete('nonexistent.jpg')).resolves.not.toThrow();
    });
  });

  describe('getPublicUrl', () => {
    it('should return /uploads/avatars/{key}', () => {
      const result = provider.getPublicUrl('user-123-avatar.jpg');

      expect(result).toBe('/uploads/avatars/user-123-avatar.jpg');
    });
  });
});
