/**
 * PrismaService — type + injection-token shell.
 *
 * SCRUM-488 / AUTH v2 + Tenancy v1 — Phase 0.2.
 *
 * The class declaration is preserved for TypeScript typing and as the
 * NestJS dependency-injection token. The PrismaModule provider, however,
 * uses `useFactory` to construct an EXTENDED client at boot
 * (PrismaClient -> $extends(buildTenantFilterExtension())). Consumers see
 * the same surface (`prisma.user.findMany`, etc.) because Prisma Client
 * Extensions preserve the model proxies.
 *
 * Connect happens inside the factory; disconnect via
 * PrismaModule.onApplicationShutdown(). The `onModuleInit`/`onModuleDestroy`
 * methods that used to live on this class are GONE because NestJS never
 * instantiates this class anymore — the factory short-circuits it.
 */

import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    super({ adapter });
  }
}
