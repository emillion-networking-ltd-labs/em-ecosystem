import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import {
  authConfig,
  oauthConfig,
  appConfig,
  configValidationSchema,
} from './config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { GLOBAL_RATE_LIMIT } from './auth/constants/auth.constants';
import { AuditModule } from './audit/audit.module';
import { SecurityModule } from './security/security.module';
import { MailModule } from './mail/mail.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RedisModule } from './common/services/redis.module';
import { GeolocationModule } from './geolocation/geolocation.module';
import { StorageModule } from './storage';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [authConfig, oauthConfig, appConfig],
      validationSchema: configValidationSchema,
      validationOptions: { abortEarly: true },
    }),
    RedisModule,
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: GLOBAL_RATE_LIMIT.ttl,
        limit: GLOBAL_RATE_LIMIT.limit,
      },
    ]),
    PrismaModule,
    GeolocationModule,
    AuthModule,
    UsersModule,
    AuditModule,
    SecurityModule,
    MailModule,
    PermissionsModule,
    StorageModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: { index: false },
    }),
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
