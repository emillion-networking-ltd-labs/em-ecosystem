import { Module } from '@nestjs/common';
import { FILE_STORAGE } from './file-storage.interface';
import { LocalStorageProvider } from './local-storage.provider';

@Module({
  providers: [{ provide: FILE_STORAGE, useClass: LocalStorageProvider }],
  exports: [FILE_STORAGE],
})
export class StorageModule {}
