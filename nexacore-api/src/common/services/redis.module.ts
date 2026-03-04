import { Global, Module, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const logger = new Logger('RedisModule');
        const redis = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD || undefined,
          db: parseInt(process.env.REDIS_DB || '0', 10),
          keyPrefix: process.env.REDIS_KEY_PREFIX || 'nexacore:',
          lazyConnect: true,
          maxRetriesPerRequest: 3,
          retryStrategy: (times: number) => {
            if (times > 5) return null;
            return Math.min(times * 200, 2000);
          },
        });

        redis.on('connect', () => logger.log('Redis connected'));
        redis.on('error', (err) => logger.warn(`Redis error: ${err.message}`));

        redis.connect().catch((err) => {
          logger.warn(`Redis initial connection failed: ${err.message}`);
        });

        return redis;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
