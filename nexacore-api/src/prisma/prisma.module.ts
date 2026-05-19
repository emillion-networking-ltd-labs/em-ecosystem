/**
 * PrismaModule — global Prisma client provider with tenant-filter extension.
 *
 * SCRUM-488 / AUTH v2 + Tenancy v1 — Phase 0.2 (factory provider added).
 *
 * The provider returns the extended client (PrismaClient + tenant-filter
 * extension) via useFactory at boot. PrismaService remains the injection
 * token; from a consumer's perspective `prisma.<model>.findMany(...)` works
 * unchanged.
 *
 * Lifecycle: $connect happens inside the factory; $disconnect via
 * OnApplicationShutdown.
 */

import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaService } from './prisma.service';
import { buildTenantFilterExtension } from './tenant-filter.extension';

@Global()
@Module({
  providers: [
    {
      provide: PrismaService,
      useFactory: async (): Promise<PrismaService> => {
        const adapter = new PrismaPg({
          connectionString: process.env.DATABASE_URL,
        });
        const base = new PrismaClient({ adapter });
        await base.$connect();
        return base.$extends(
          buildTenantFilterExtension(),
        ) as unknown as PrismaService;
      },
    },
  ],
  exports: [PrismaService],
})
export class PrismaModule implements OnApplicationShutdown {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async onApplicationShutdown(): Promise<void> {
    await (this.prisma as unknown as PrismaClient).$disconnect();
  }
}
