import { describe, it, expect, afterEach } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { blobSha, governedSources, validateManifest, readManifest, emptyManifest } from "../registry/_manifest.mjs";

// ECO-152 (design-propagation Fase 1 E4a) — manifest por-consumidor + verbos pin/hold/unhold + gate.
// Test de integración end-to-end: shellea el CLI REAL (execFileSync) contra un consumidor temporal y valida
// con la MISMA lógica que el gate (validateManifest), cubriendo el flujo add→manifest→hold→update-skip→gate.

const DS = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(DS, "registry", "cli.mjs");
const REGISTRY = JSON.parse(readFileSync(join(DS, "registry.json"), "utf8"));
const SOURCES = governedSources(REGISTRY);
const DS_BUTTON = readFileSync(join(DS, "components", "Button.tsx"), "utf8");
const BUTTON_KEY = "components/ui/Button.tsx";
const SPINNER_KEY = "components/ui/SpinnerInfinity.tsx"; // registryDependency de Button

const tmps: string[] = [];
function newConsumer(): string {
  const t = mkdtempSync(join(tmpdir(), "em-ui-manifest-"));
  tmps.push(t);
  return t;
}
afterEach(() => {
  for (const t of tmps.splice(0)) rmSync(t, { recursive: true, force: true });
});

function run(args: string[]): { status: number; out: string } {
  try {
    const out = execFileSync("node", [CLI, ...args], { cwd: DS, encoding: "utf8" });
    return { status: 0, out };
  } catch (e: unknown) {
    const err = e as { status?: number; stdout?: string; stderr?: string };
    return { status: err.status ?? -1, out: (err.stdout ?? "") + (err.stderr ?? "") };
  }
}

describe("blob-sha (lynchpin: byte-length, no char-length)", () => {
  it("casa EXACTAMENTE con git hash-object, incluido contenido multibyte", () => {
    for (const rel of ["components/Button.tsx", "components/AlertBox.tsx"]) {
      const abs = join(DS, rel);
      const buf = readFileSync(abs);
      const git = execFileSync("git", ["hash-object", abs], { cwd: DS, encoding: "utf8" }).trim();
      expect(blobSha(buf)).toBe(git);
    }
    // AlertBox tiene acentos → bytes > chars: es el caso que un header `blob <chars>` rompería en silencio.
    const alert = readFileSync(join(DS, "components", "AlertBox.tsx"));
    expect(alert.length).toBeGreaterThan(alert.toString("utf8").length);
  });
});

describe("em-ui add → manifest", () => {
  it("escribe el manifest con el cierre y el blob-sha byte-exacto de cada fuente", () => {
    const c = newConsumer();
    const r = run(["add", "Button", "--dest", c]);
    expect(r.status).toBe(0);
    const m = readManifest(c);
    expect(m.files[BUTTON_KEY]).toEqual({ from: "components/Button.tsx", sha: blobSha(Buffer.from(DS_BUTTON)) });
    expect(m.files[SPINNER_KEY]?.from).toBe("components/SpinnerInfinity.tsx");
    expect(m.files[SPINNER_KEY]?.sha).toMatch(/^[0-9a-f]{40}$/);
  });
});

describe("em-ui hold / unhold / update", () => {
  it("hold <C> congela SOLO el fichero propio del componente, no su closure (granularidad)", () => {
    const c = newConsumer();
    run(["add", "Button", "--dest", c]);
    const r = run(["hold", "Button", "--dest", c]);
    expect(r.status).toBe(0);
    const m = readManifest(c);
    expect(m.files[BUTTON_KEY].hold).toBe(true);
    // SpinnerInfinity es registryDependency de Button — NO debe congelarse por `hold Button`.
    expect(m.files[SPINNER_KEY].hold).toBeUndefined();
  });

  it("update SALTA un fichero en hold (el freeze gana al catch-up de stale), exit 0", () => {
    const c = newConsumer();
    run(["add", "Button", "--dest", c]);
    const buttonPath = join(c, "components", "ui", "Button.tsx");
    // Diverge SIN declarar → normalmente `update` adoptaría el DS (catch-up). Pero al estar en hold, se salta.
    writeFileSync(buttonPath, "contenido divergente sin marcador\n");
    run(["hold", "Button", "--dest", c]);
    const r = run(["update", "Button", "--dest", c]);
    expect(r.status).toBe(0); // hold es benigno (a diferencia de @em-ui-adapted, que sale ≠0)
    expect(readFileSync(buttonPath, "utf8")).toBe("contenido divergente sin marcador\n"); // NO clobbeado
    expect(readManifest(c).files[BUTTON_KEY].sha).toBe(blobSha(Buffer.from(DS_BUTTON))); // base intacta
  });

  it("unhold + update adopta la fuente del DS y limpia el hold", () => {
    const c = newConsumer();
    run(["add", "Button", "--dest", c]);
    const buttonPath = join(c, "components", "ui", "Button.tsx");
    writeFileSync(buttonPath, "contenido divergente sin marcador\n");
    run(["hold", "Button", "--dest", c]);
    run(["unhold", "Button", "--dest", c]);
    const r = run(["update", "Button", "--dest", c]);
    expect(r.status).toBe(0);
    expect(readFileSync(buttonPath, "utf8")).toBe(DS_BUTTON); // ya no congelado → adoptado
    expect(readManifest(c).files[BUTTON_KEY].hold).toBeUndefined();
  });
});

describe("check-manifest (validateManifest — la misma regla que el gate)", () => {
  it("manifest completo e íntegro → sin violaciones", () => {
    const c = newConsumer();
    run(["add", "Button", "--dest", c]);
    expect(validateManifest(SOURCES, c, readManifest(c))).toEqual([]);
  });

  it("manifest ausente/vacío con copias presentes → INCOMPLETO (fail-closed)", () => {
    const c = newConsumer();
    run(["add", "Button", "--dest", c]);
    const v = validateManifest(SOURCES, c, emptyManifest());
    expect(v.some((x) => x.startsWith("INCOMPLETO") && x.includes(BUTTON_KEY))).toBe(true);
  });

  it("sha corrupto, from inválido y entrada huérfana → cada uno es una violación", () => {
    const c = newConsumer();
    run(["add", "Button", "--dest", c]);
    const base = readManifest(c);

    const badSha = structuredClone(base);
    badSha.files[BUTTON_KEY].sha = "nope";
    expect(validateManifest(SOURCES, c, badSha).some((x) => x.startsWith("SHA"))).toBe(true);

    const badFrom = structuredClone(base);
    badFrom.files[BUTTON_KEY].from = "components/DoesNotExist.tsx";
    expect(validateManifest(SOURCES, c, badFrom).some((x) => x.startsWith("FROM"))).toBe(true);

    const orphan = structuredClone(base);
    orphan.files["hooks/useTheme.ts"] = { from: "hooks/useTheme.ts", sha: base.files[BUTTON_KEY].sha };
    expect(validateManifest(SOURCES, c, orphan).some((x) => x.startsWith("HUERFANA"))).toBe(true);
  });
});
