// Supply-chain regression guard for GHSA-ggr8-5vv4-36mx: deepmerge-ts < 8.0.0 exhausts the stack when
// merging recursive object graphs, and the fix landed only in the 8.x line (7.1.6 is still affected).
// It reaches this package twice — prisma -> @prisma/config -> deepmerge-ts, and
// preview-email -> mailparser -> html-to-text -> deepmerge-ts — so it is pinned by a package.json
// override rather than by bumping either consumer. Notably, `npm audit` proposes prisma@6.12.0 as the
// "fix": a MAJOR DOWNGRADE of a direct dependency to dodge a transitive bug. This guard encodes the
// decision we made instead — keep Prisma current, raise the vulnerable transitive.
//
// The assertion reads the LOCKFILE, not a resolved module: that is what `npm ci` actually installs, it
// works for transitive packages whose `exports` map hides package.json, and it catches EVERY copy in
// the tree rather than only the one that happens to resolve first.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function lockedVersions(pkg: string): string[] {
  const lock = JSON.parse(
    readFileSync(join(__dirname, '..', '..', 'package-lock.json'), 'utf-8'),
  ) as { packages: Record<string, { version?: string }> };
  return Object.entries(lock.packages)
    .filter(([path]) => path.endsWith(`node_modules/${pkg}`))
    .map(([, entry]) => entry.version ?? '');
}

describe('deepmerge-ts supply-chain guard (GHSA-ggr8-5vv4-36mx)', () => {
  it('locks every deepmerge-ts copy to the patched line (>= 8.0.0)', () => {
    const versions = lockedVersions('deepmerge-ts');
    expect(versions.length).toBeGreaterThan(0); // present: the guard must not pass by absence
    for (const version of versions) {
      expect(parseInt(version.split('.')[0], 10)).toBeGreaterThanOrEqual(8);
    }
  });

  it('keeps prisma on its current major — the fix must not be a downgrade', () => {
    const versions = lockedVersions('prisma');
    expect(versions.length).toBeGreaterThan(0);
    for (const version of versions) {
      expect(parseInt(version.split('.')[0], 10)).toBeGreaterThanOrEqual(7);
    }
  });
});
