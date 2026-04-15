export interface FileStorageService {
  /**
   * Upload a file buffer and return the public URL path.
   */
  upload(buffer: Buffer, key: string): Promise<string>;

  /**
   * Delete a file by its storage key. No-op if not found.
   */
  delete(key: string): Promise<void>;

  /**
   * Get the public URL for a stored file.
   */
  getPublicUrl(key: string): string;
}

export const FILE_STORAGE = 'FILE_STORAGE';
