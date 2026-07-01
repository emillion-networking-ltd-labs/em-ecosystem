// ECO-125 — regression guard for check-lockfile-integrity.mjs.
// Run: node --test .github/scripts/
import { test } from "node:test";
import assert from "node:assert";
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = fileURLToPath(new URL("./check-lockfile-integrity.mjs", import.meta.url));

// Runs the checker against a lockfile object; returns its exit code (0 = pass).
function run(lock) {
  const dir = mkdtempSync(join(tmpdir(), "lockfile-integrity-"));
  const p = join(dir, "package-lock.json");
  writeFileSync(p, JSON.stringify(lock));
  try {
    execFileSync("node", [SCRIPT, p], { stdio: "pipe" });
    return 0;
  } catch (e) {
    return e.status ?? 1;
  }
}

test("optional platform dep WITHOUT integrity → passes (tolerated)", () => {
  const lock = {
    packages: {
      "": {},
      "node_modules/@tailwindcss/oxide-wasm32-wasi/node_modules/tslib": {
        version: "2.6.0",
        optional: true,
      },
    },
  };
  assert.equal(run(lock), 0);
});

test("normal dep WITHOUT integrity → fails (strict)", () => {
  const lock = {
    packages: {
      "": {},
      "node_modules/left-pad": { version: "1.0.0" },
    },
  };
  assert.notEqual(run(lock), 0);
});

test("normal dep WITH integrity → passes", () => {
  const lock = {
    packages: {
      "": {},
      "node_modules/left-pad": { version: "1.0.0", integrity: "sha512-abc" },
    },
  };
  assert.equal(run(lock), 0);
});

test("link entry (workspace) WITHOUT integrity → passes", () => {
  const lock = {
    packages: {
      "": {},
      "node_modules/@scope/local": { link: true, resolved: "packages/local" },
    },
  };
  assert.equal(run(lock), 0);
});
