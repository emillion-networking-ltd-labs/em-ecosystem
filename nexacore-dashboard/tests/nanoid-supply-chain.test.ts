// Supply-chain regression guard for GHSA-2v37-7h3g-55p8: nanoid < 3.3.18 can loop indefinitely when a
// custom generator is called with size zero. nanoid reaches this package transitively through postcss
// (build tooling), so it is pinned by a package.json override. The fix stays inside the 3.x line
// (3.3.18), which is why this guard asserts that floor rather than a major bump.
//
// The assertion reads the LOCKFILE, not a resolved module: that is what `npm ci` actually installs, and
// it catches EVERY copy in the tree rather than only the one that happens to resolve first.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('nanoid supply-chain guard (GHSA-2v37-7h3g-55p8)', () => {
  it('locks every nanoid copy to the patched version (>= 3.3.18)', () => {
    const lock = JSON.parse(
      readFileSync(join(__dirname, '..', 'package-lock.json'), 'utf-8'),
    ) as { packages: Record<string, { version?: string }> };
    const versions = Object.entries(lock.packages)
      .filter(([path]) => path.endsWith('node_modules/nanoid'))
      .map(([, entry]) => entry.version ?? '');

    expect(versions.length).toBeGreaterThan(0); // present: the guard must not pass by absence
    for (const version of versions) {
      const [major, minor, patch] = version.split('.').map((n) => parseInt(n, 10));
      // Lexicographic on (major, minor, patch) >= (3, 3, 18).
      const patched =
        major > 3 || (major === 3 && (minor > 3 || (minor === 3 && patch >= 18)));
      expect(patched).toBe(true);
    }
  });
});
