import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FileStorageService } from './file-storage.interface';

@Injectable()
export class LocalStorageProvider implements FileStorageService {
  private readonly uploadDir: string;

  constructor(private readonly config: ConfigService) {
    this.uploadDir = this.config.get<string>('UPLOAD_DIR', './uploads');
  }

  async upload(buffer: Buffer, key: string): Promise<string> {
    const dir = path.join(this.uploadDir, 'avatars');
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, key);
    await fs.writeFile(filePath, buffer);
    return `/uploads/avatars/${key}`;
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, 'avatars', key);
    try {
      await fs.unlink(filePath);
    } catch {
      // File not found — no-op
    }
  }

  getPublicUrl(key: string): string {
    return `/uploads/avatars/${key}`;
  }
}
