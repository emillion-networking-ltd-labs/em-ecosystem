import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from './enums/audit-action.enum';
import { AuditLogEntry } from './interfaces/audit-log-entry.interface';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: entry.action,
          userId: entry.userId ?? null,
          targetUserId: entry.targetUserId ?? null,
          ipAddress: entry.ipAddress ?? null,
          userAgent: entry.userAgent ?? null,
          metadata: (entry.metadata as Prisma.InputJsonValue) ?? undefined,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to write audit log: ${entry.action}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async findAll(query: {
    page: number;
    limit: number;
    action?: AuditAction;
    userId?: string;
    startDate?: string;
    endDate?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const {
      page,
      limit,
      action,
      userId,
      startDate,
      endDate,
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (action) {
      where.action = action;
    }

    if (userId) {
      where.OR = [{ userId }, { targetUserId: userId }];
    }

    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          targetUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async countRecentActions(params: {
    action: AuditAction;
    userId: string;
    windowMinutes: number;
  }): Promise<number> {
    const sinceDate = new Date(Date.now() - params.windowMinutes * 60 * 1000);
    return this.prisma.auditLog.count({
      where: {
        action: params.action,
        userId: params.userId,
        createdAt: { gte: sinceDate },
      },
    });
  }

  async countRecentActionsByIp(params: {
    action: AuditAction;
    ipAddress: string;
    windowMinutes: number;
  }): Promise<number> {
    const sinceDate = new Date(Date.now() - params.windowMinutes * 60 * 1000);
    return this.prisma.auditLog.count({
      where: {
        action: params.action,
        ipAddress: params.ipAddress,
        createdAt: { gte: sinceDate },
      },
    });
  }

  async hasRecentAction(params: {
    action: AuditAction;
    userId?: string;
    ipAddress?: string;
    windowMinutes: number;
  }): Promise<boolean> {
    const sinceDate = new Date(Date.now() - params.windowMinutes * 60 * 1000);
    const where: Record<string, unknown> = {
      action: params.action,
      createdAt: { gte: sinceDate },
    };
    if (params.userId) where.userId = params.userId;
    if (params.ipAddress) where.ipAddress = params.ipAddress;

    const entry = await this.prisma.auditLog.findFirst({ where });
    return entry !== null;
  }

  async findById(id: string) {
    return this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        targetUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }
}
