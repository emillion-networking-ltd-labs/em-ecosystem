import { describe, it, expect, afterEach } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { isAdapted, hasConflictMarkers } from "../registry/_reconcile.mjs";

// ECO-144 (design-propagation Fase 1) — guard de `em-ui update` + helpers puros del reconcile.
// El guard reemplaza el overwrite ciego (cli.mjs) que destruía las adaptaciones @em-ui-adapted del consumidor.

const DS = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(DS, "registry", "cli.mjs");
const DS_BUTTON = readFileSync(join(DS, "components", "Button.tsx"), "utf8");

const tmps: string[] = [];
function newConsumer(): string {
  const t = mkdtempSync(join(tmpdir(), "em-ui-recon-"));
  mkdirSync(join(t, "components", "ui"), { recursive: true });
  tmps.push(t);
  return t;
}
afterEach(() => {
  for (const t of tmps.splice(0)) rmSync(t, { recursive: true, force: true });
});

function runUpdate(dest: string, extra: string[] = []): { status: number; out: string } {
  try {
    const out = execFileSync("node", [CLI, "update", "Button", "--dest", dest, ...extra], {
      cwd: DS,
      encoding: "utf8",
    });
    return { status: 0, out };
  } catch (e: unknown) {
    const err = e as { status?: number; stdout?: string; stderr?: string };
    return { status: err.status ?? -1, out: (err.stdout ?? "") + (err.stderr ?? "") };
  }
}

describe("_reconcile helpers (ECO-144)", () => {
  it("isAdapted: reconoce el marcador SOLO en la cabecera (no substring global)", () => {
    expect(isAdapted("// @em-ui-adapted: x\nconst a = 1")).toBe(true);
    expect(isAdapted("line1\nline2\n// @em-ui-adapted en la cabecera\nx")).toBe(true);
    // un marcador MÁS ALLÁ de la cabecera (o incrustado en un conflicto) NO cuenta como declaración
    const deep = Array(10).fill("x").join("\n") + "\n// @em-ui-adapted body";
    expect(isAdapted(deep)).toBe(false);
    expect(isAdapted("const a = 1")).toBe(false);
  });

  it("hasConflictMarkers: line-anchored, sin falsos por '=' decorativo", () => {
    expect(hasConflictMarkers("a\n<<<<<<< HEAD\nb")).toBe(true);
    expect(hasConflictMarkers("a\n=======\nb")).toBe(true);
    expect(hasConflictMarkers("a\n>>>>>>> theirs\nb")).toBe(true);
    expect(hasConflictMarkers("a\n||||||| base\nb")).toBe(true);
    expect(hasConflictMarkers("// ==== sección decorativa ====\nconst a = 1")).toBe(false);
    expect(hasConflictMarkers("const a = 1;\nconst b = 2;\n")).toBe(false);
  });
});

describe("em-ui update guard (integración end-to-end, ECO-144)", () => {
  it("NUNCA pisa un fichero @em-ui-adapted: bloquea, sale ≠0, deja la adaptación intacta", () => {
    const c = newConsumer();
    const adapted =
      "// @em-ui-adapted: divergencia de test\nexport default function Button() {\n  return null;\n}\n";
    const p = join(c, "components", "ui", "Button.tsx");
    writeFileSync(p, adapted);
    const r = runUpdate(c);
    expect(r.status).toBe(3); // bloqueado
    expect(readFileSync(p, "utf8")).toBe(adapted); // NO clobbeado (era el bug)
  });

  it("--force SÍ adopta el DS (descarta la adaptación, opt-in)", () => {
    const c = newConsumer();
    const p = join(c, "components", "ui", "Button.tsx");
    writeFileSync(p, "// @em-ui-adapted: vieja\nold\n");
    const r = runUpdate(c, ["--force"]);
    expect(r.status).toBe(0);
    expect(readFileSync(p, "utf8")).toBe(DS_BUTTON);
  });

  it("divergencia SIN declarar (stale) → catch-up: adopta la fuente del DS", () => {
    const c = newConsumer();
    const p = join(c, "components", "ui", "Button.tsx");
    writeFileSync(p, "contenido stale sin marcador\n");
    const r = runUpdate(c);
    expect(r.status).toBe(0);
    expect(readFileSync(p, "utf8")).toBe(DS_BUTTON);
  });
});
