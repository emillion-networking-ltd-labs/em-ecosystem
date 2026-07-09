import { describe, it, expect, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// ECO-164 (design-distribution) — deps-install: el registry anota las deps npm por componente (build-registry)
// y `em-ui add/update` las PROPAGA al package.json del consumidor. Test de INTEGRACIÓN end-to-end: shellea el
// CLI REAL (execFileSync) contra un consumidor temporal y verifica el flujo add→package.json:
//   merge de faltantes · no-overwrite del rango que el consumidor ya fijó · union por cierre · --install opt-in.
// (Cambio crítico del contrato de distribución em-ui → integración, no solo unit; ver AGENTS.md.)

const DS = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(DS, "registry", "cli.mjs");

const tmps: string[] = [];
function newConsumer(deps: Record<string, string> = {}): { root: string; src: string; pkgPath: string } {
  const root = mkdtempSync(join(tmpdir(), "em-ui-deps-"));
  tmps.push(root);
  const src = join(root, "src");
  mkdirSync(src, { recursive: true });
  const pkgPath = join(root, "package.json");
  writeFileSync(pkgPath, JSON.stringify({ name: "consumer", dependencies: deps }, null, 2) + "\n");
  return { root, src, pkgPath };
}
afterEach(() => {
  for (const t of tmps.splice(0)) rmSync(t, { recursive: true, force: true });
});

function run(args: string[]): { status: number; out: string } {
  const r = spawnSync("node", [CLI, ...args], { cwd: DS, encoding: "utf8" });
  return { status: r.status ?? -1, out: (r.stdout ?? "") + (r.stderr ?? "") };
}
const readDeps = (p: string): Record<string, string> => JSON.parse(readFileSync(p, "utf8")).dependencies ?? {};

describe("em-ui add → deps npm al package.json del consumidor (ECO-164)", () => {
  it("propaga la dep externa directa (DoughnutChart → recharts)", () => {
    const c = newConsumer();
    const r = run(["add", "DoughnutChart", "--dest", c.src]);
    expect(r.status).toBe(0);
    expect(readDeps(c.pkgPath)["recharts"]).toBeTruthy();
  });

  it("propaga las deps ARRASTRADAS por ficheros internos (IconButton → clsx + tailwind-merge vía lib/utils.ts)", () => {
    const c = newConsumer();
    const r = run(["add", "IconButton", "--dest", c.src]);
    expect(r.status).toBe(0);
    const deps = readDeps(c.pkgPath);
    expect(deps["clsx"]).toBeTruthy();
    expect(deps["tailwind-merge"]).toBeTruthy();
  });

  it("NO pisa un rango que el consumidor ya fijó; lo reporta como mismatch", () => {
    const c = newConsumer({ recharts: "^2.0.0" });
    const r = run(["add", "DoughnutChart", "--dest", c.src]);
    expect(readDeps(c.pkgPath)["recharts"]).toBe("^2.0.0"); // intacto
    expect(r.out).toMatch(/rango distinto/i);
  });

  it("un componente hoja sin deps externas NO toca el package.json (Divider)", () => {
    const c = newConsumer({ foo: "^1.0.0" });
    const before = readFileSync(c.pkgPath, "utf8");
    const r = run(["add", "Divider", "--dest", c.src]);
    expect(r.status).toBe(0);
    expect(readFileSync(c.pkgPath, "utf8")).toBe(before);
  });

  it("por defecto NO instala: no crea node_modules y sugiere el install", () => {
    const c = newConsumer();
    const r = run(["add", "DoughnutChart", "--dest", c.src]);
    expect(existsSync(join(c.root, "node_modules"))).toBe(false);
    expect(r.out).toMatch(/npm install|--install/);
  });

  it("idempotente: un segundo add reconoce que las deps ya están (no re-añade)", () => {
    const c = newConsumer();
    run(["add", "DoughnutChart", "--dest", c.src]);
    const r2 = run(["add", "DoughnutChart", "--dest", c.src]);
    expect(r2.out).toMatch(/ya están/i);
  });

  it("sin package.json en el consumidor: avisa y NO falla el pull (deps sin propagar)", () => {
    const root = mkdtempSync(join(tmpdir(), "em-ui-deps-nopkg-"));
    tmps.push(root);
    const src = join(root, "src");
    mkdirSync(src, { recursive: true });
    const r = run(["add", "DoughnutChart", "--dest", src]);
    expect(r.status).toBe(0); // el copiado de ficheros sí ocurre; solo se avisa de las deps
    expect(r.out).toMatch(/deps NO propagadas|no hay package\.json/i);
  });
});
