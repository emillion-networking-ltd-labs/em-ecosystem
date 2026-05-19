import { TenantContext } from '../../common/context/tenant-context';
import { CrossTenantViolationError } from '../../common/context/tenant-context.errors';
import {
  buildTenantFilterExtension,
  handleTenantFilteredQuery,
  injectTenantId,
} from '../tenant-filter.extension';

const ACTIVE = 'tenant-A';
const OTHER = 'tenant-B';

describe('injectTenantId (pure helper)', () => {
  describe('read operations', () => {
    const reads = [
      'findFirst',
      'findFirstOrThrow',
      'findUnique',
      'findUniqueOrThrow',
      'findMany',
      'count',
      'aggregate',
      'groupBy',
      'updateMany',
      'deleteMany',
    ];

    it.each(reads)('%s with no where → injects tenantId', (op) => {
      const next = injectTenantId(op, undefined, ACTIVE);
      expect(next).toEqual({ where: { tenantId: ACTIVE } });
    });

    it.each(reads)(
      '%s with where but no tenantId → injects tenantId preserving siblings',
      (op) => {
        const next = injectTenantId(op, { where: { name: 'x' } }, ACTIVE);
        expect(next.where).toEqual({ name: 'x', tenantId: ACTIVE });
      },
    );

    it.each(reads)('%s with matching where.tenantId → no-op', (op) => {
      const next = injectTenantId(op, { where: { tenantId: ACTIVE } }, ACTIVE);
      expect(next.where).toEqual({ tenantId: ACTIVE });
    });

    it.each(reads)(
      '%s with mismatched where.tenantId → throws CrossTenantViolationError',
      (op) => {
        expect(() =>
          injectTenantId(op, { where: { tenantId: OTHER } }, ACTIVE),
        ).toThrow(CrossTenantViolationError);
      },
    );
  });

  describe('write operations — create', () => {
    it('create with no data → wraps {data:{tenantId}}', () => {
      const next = injectTenantId('create', {}, ACTIVE);
      expect(next).toEqual({ data: { tenantId: ACTIVE } });
    });

    it('create with data → injects tenantId', () => {
      const next = injectTenantId('create', { data: { name: 'X' } }, ACTIVE);
      expect(next.data).toEqual({ name: 'X', tenantId: ACTIVE });
    });

    it('create with matching tenantId → no-op', () => {
      const next = injectTenantId(
        'create',
        { data: { tenantId: ACTIVE } },
        ACTIVE,
      );
      expect(next.data).toEqual({ tenantId: ACTIVE });
    });

    it('create with mismatched data.tenantId → throws', () => {
      expect(() =>
        injectTenantId('create', { data: { tenantId: OTHER } }, ACTIVE),
      ).toThrow(CrossTenantViolationError);
    });
  });

  describe('write operations — createMany', () => {
    it('createMany with array data injects into each row', () => {
      const next = injectTenantId(
        'createMany',
        { data: [{ a: 1 }, { b: 2 }] },
        ACTIVE,
      );
      expect(next.data).toEqual([
        { a: 1, tenantId: ACTIVE },
        { b: 2, tenantId: ACTIVE },
      ]);
    });

    it('createMany with single-object data injects', () => {
      const next = injectTenantId('createMany', { data: { a: 1 } }, ACTIVE);
      expect(next.data).toEqual({ a: 1, tenantId: ACTIVE });
    });

    it('createMany throws on mismatched row', () => {
      expect(() =>
        injectTenantId('createMany', { data: [{ tenantId: OTHER }] }, ACTIVE),
      ).toThrow(CrossTenantViolationError);
    });
  });

  describe('write operations — update / delete / upsert', () => {
    it('update injects where.tenantId', () => {
      const next = injectTenantId(
        'update',
        {
          where: { id: 'a' },
          data: { name: 'Y' },
        },
        ACTIVE,
      );
      expect(next.where).toEqual({ id: 'a', tenantId: ACTIVE });
      expect(next.data).toEqual({ name: 'Y' });
    });

    it('delete injects where.tenantId', () => {
      const next = injectTenantId('delete', { where: { id: 'a' } }, ACTIVE);
      expect(next.where).toEqual({ id: 'a', tenantId: ACTIVE });
    });

    it('upsert injects where.tenantId AND create.tenantId', () => {
      const next = injectTenantId(
        'upsert',
        {
          where: { id: 'a' },
          create: { name: 'A' },
          update: { name: 'B' },
        },
        ACTIVE,
      );
      expect(next.where).toEqual({ id: 'a', tenantId: ACTIVE });
      expect(next.create).toEqual({ name: 'A', tenantId: ACTIVE });
    });

    it('upsert throws on mismatched create.tenantId', () => {
      expect(() =>
        injectTenantId(
          'upsert',
          {
            where: { id: 'a' },
            create: { tenantId: OTHER },
            update: {},
          },
          ACTIVE,
        ),
      ).toThrow(CrossTenantViolationError);
    });
  });

  describe('unknown operations', () => {
    it('returns pass-through args for unrecognized operations', () => {
      const next = injectTenantId('totallyNewProp', { foo: 'bar' }, ACTIVE);
      expect(next).toEqual({ foo: 'bar' });
    });
  });
});

describe('handleTenantFilteredQuery — extension behavior', () => {
  function recorder() {
    const calls: unknown[] = [];
    const query = (a: unknown) => {
      calls.push(a);
      return Promise.resolve('ok');
    };
    return { calls, query };
  }

  it('non-scoped model → passes through untouched', async () => {
    const { calls, query } = recorder();
    const result = await handleTenantFilteredQuery({
      model: 'User',
      operation: 'findMany',
      args: { where: { id: 'x' } },
      query,
    });
    expect(result).toBe('ok');
    expect(calls).toEqual([{ where: { id: 'x' } }]);
  });

  it('scoped model + bypass scope → passes through untouched', async () => {
    const { calls, query } = recorder();
    await TenantContext.runWithBypass('test', async () => {
      await handleTenantFilteredQuery({
        model: 'TenantMembership',
        operation: 'findMany',
        args: { where: { foo: 'bar' } },
        query,
      });
    });
    expect(calls).toEqual([{ where: { foo: 'bar' } }]);
  });

  it('scoped model + active context → injects tenantId', async () => {
    const { calls, query } = recorder();
    await TenantContext.run('tenant-A', async () => {
      await handleTenantFilteredQuery({
        model: 'TenantMembership',
        operation: 'findMany',
        args: {},
        query,
      });
    });
    expect(calls).toEqual([{ where: { tenantId: 'tenant-A' } }]);
  });

  it('scoped model + no context + no bypass → throws', async () => {
    const { query } = recorder();
    await expect(
      handleTenantFilteredQuery({
        model: 'TenantMembership',
        operation: 'findMany',
        args: {},
        query,
      }),
    ).rejects.toThrow('Tenant context required');
  });

  it('scoped model + cross-tenant manual where.tenantId → throws', async () => {
    const { query } = recorder();
    await expect(
      TenantContext.run('tenant-A', async () =>
        handleTenantFilteredQuery({
          model: 'TenantMembership',
          operation: 'findMany',
          args: { where: { tenantId: 'tenant-OTHER' } },
          query,
        }),
      ),
    ).rejects.toThrow(CrossTenantViolationError);
  });
});

describe('buildTenantFilterExtension — wrapper smoke', () => {
  it('returns a Prisma extension wrapper (function or object) without throwing', () => {
    const ext = buildTenantFilterExtension();
    expect(ext).toBeDefined();
    // Prisma 7 returns a function from defineExtension; we only assert it
    // builds without throwing. Behavior is covered by handleTenantFilteredQuery.
  });
});
