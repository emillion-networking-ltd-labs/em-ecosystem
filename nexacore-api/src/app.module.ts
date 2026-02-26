import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { GLOBAL_RATE_LIMIT } from './auth/constants/auth.constants';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: GLOBAL_RATE_LIMIT.ttl,
        limit: GLOBAL_RATE_LIMIT.limit,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
