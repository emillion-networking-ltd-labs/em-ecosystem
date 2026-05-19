import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Tenant, TenantMembership } from '@prisma/client';
import { ErrorMessages } from '../common/constants/error-messages';
import { TenantContext } from '../common/context/tenant-context';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

/**
 * TenantsService — CRUD for the Tenant primitive.
 *
 * SCRUM-487 / AUTH v2 + Tenancy v1 — Phase 0.1.
 * See ai-specs/changes/auth/programs/AUTH-v2.md §2.
 *
 * This service is exported by a {@link Global} module so any future module
 * (auth v2, business entities, satellite integrations) can inject it
 * without ceremony. It manages the Tenant root entity and the 1:1
 * TenantSettings child; TenantMembership/Invitation lifecycle lives in
 * dedicated services to be built in later phases.
 */
@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find a Tenant by its primary key.
   *
   * @returns The Tenant or `null` if not found.
   */
  async findById(id: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  /**
   * Find a Tenant by its URL-safe slug.
   *
   * @returns The Tenant or `null` if not found.
   */
  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.prisma.tenant.findUnique({ where: { slug } });
  }

  /**
   * Atomically create a Tenant + its 1:1 TenantSettings record.
   *
   * Wraps both inserts in a single Prisma transaction so partial creation
   * is impossible: either both rows exist or neither does. Slug uniqueness
   * is enforced by the database; on collision we re-throw as a
   * domain-level {@link ConflictException} with a centralized error message.
   *
   * @throws ConflictException When `dto.slug` is already in use.
   */
  async create(dto: CreateTenantDto): Promise<Tenant> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.create({
          data: {
            slug: dto.slug,
            name: dto.name,
            status: dto.status ?? 'active',
          },
        });
        await tx.tenantSettings.create({
          data: { tenantId: tenant.id },
        });
        return tenant;
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(ErrorMessages.tenants.SLUG_TAKEN);
      }
      throw err;
    }
  }

  /**
   * Partially update a Tenant. Only the fields present in `dto` are written.
   *
   * @throws NotFoundException When the tenant id does not exist.
   * @throws ConflictException When `dto.slug` conflicts with another tenant.
   */
  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    try {
      return await this.prisma.tenant.update({
        where: { id },
        data: dto,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2025') {
          throw new NotFoundException(ErrorMessages.tenants.NOT_FOUND);
        }
        if (err.code === 'P2002') {
          throw new ConflictException(ErrorMessages.tenants.SLUG_TAKEN);
        }
      }
      throw err;
    }
  }

  /**
   * Resolve the user's first ACTIVE TenantMembership.
   *
   * SCRUM-488 (Phase 0.2). Used by the TenantContextInterceptor to bootstrap
   * the per-request tenant context. Deterministic ordering: oldest joinedAt
   * wins; tiebreak on id ASC.
   *
   * This method queries a tenant-scoped model BEFORE any tenant context can
   * exist (it is the bootstrap), so it runs inside an explicit bypass scope
   * with reason `tenant-context-resolution`. This reason is treated as
   * audit-exempt — it is the documented bypass that is the prerequisite of
   * the audit machinery itself, not a privilege-elevation event.
   *
   * @returns The oldest active membership for the user, or null if none.
   */
  async findFirstActiveMembership(
    userId: string,
  ): Promise<TenantMembership | null> {
    return TenantContext.runWithBypass('tenant-context-resolution', () =>
      this.prisma.tenantMembership.findFirst({
        where: { userId, status: 'active' },
        orderBy: [{ joinedAt: 'asc' }, { id: 'asc' }],
      }),
    );
  }
}
