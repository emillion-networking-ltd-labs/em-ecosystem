import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './common/services/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [PrismaModule, RedisModule, AuthModule, UsersModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
