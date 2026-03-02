import {
  Module,
  Global,
  OnModuleDestroy,
  Inject,
  Logger,
} from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const logger = new Logger('RedisModule');

        const host = process.env.REDIS_HOST || 'localhost';
        const port = parseInt(process.env.REDIS_PORT || '6379', 10);
        const password = process.env.REDIS_PASSWORD || undefined;
        const db = parseInt(process.env.REDIS_DB || '0', 10);
        const keyPrefix = process.env.REDIS_KEY_PREFIX || 'nexacore:';

        const client = new Redis({
          host,
          port,
          password,
          db,
          keyPrefix,
          maxRetriesPerRequest: 1,
          lazyConnect: false,
        });

        client.on('connect', () => {
          logger.log(`Redis connected to ${host}:${port}`);
        });

        client.on('error', (err: Error) => {
          logger.error(`Redis connection error: ${err.message}`);
        });

        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
