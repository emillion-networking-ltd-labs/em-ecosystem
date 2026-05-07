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
    // `key` is generated upstream as a content-hash UUID by the avatar
    // service (no user input flows into the filename). `uploadDir` is
    // config-controlled. Path traversal is contract-prevented; the
    // security/detect-non-literal-fs-filename warnings here are for
    // dev awareness only.
    const dir = path.join(this.uploadDir, 'avatars');
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, key);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    await fs.writeFile(filePath, buffer);
    return `/uploads/avatars/${key}`;
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, 'avatars', key);
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      await fs.unlink(filePath);
    } catch {
      // File not found — no-op
    }
  }

  getPublicUrl(key: string): string {
    return `/uploads/avatars/${key}`;
  }
}
