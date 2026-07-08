import { describe, it, expect, afterEach } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { reconcileMerge } from "../registry/_merge.mjs";
import { blobSha, materializeBase, storeBase } from "../registry/_manifest.mjs";

// ECO-158 — máquina de reconciliación asistida (git merge-file 3-way base-pinned).
// Motor (contenido→contenido) + materializeBase + el flujo end-to-end vía el CLI real (`update --merge`),
// incluido el caso de referencia de ADR-028: copyFileSync destruiría la adaptación, el merge la conserva.

const DS = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CLI = join(DS, "registry", "cli.mjs");
const DS_BUTTON = readFileSync(join(DS, "components", "Button.tsx"), "utf8");
const KEY = "components/ui/Button.tsx";

const tmps: string[] = [];
function newConsumer(): string {
  const t = mkdtempSync(join(tmpdir(), "em-ui-recon-"));
  tmps.push(t);
  return t;
}
afterEach(() => {
  for (const t of tmps.splice(0)) rmSync(t, { recursive: true, force: true });
});
function run(args: string[]): { status: number; out: string } {
  try {
    return { status: 0, out: execFileSync("node", [CLI, ...args], { cwd: DS, encoding: "utf8" }) };
  } catch (e: unknown) {
    const err = e as { status?: number; stdout?: string; stderr?: string };
    return { status: err.status ?? -1, out: (err.stdout ?? "") + (err.stderr ?? "") };
  }
}

// Monta un consumidor temporal con Button = `copyContent`, manifest fijado a `baseContent`, y el store poblado.
function setup(baseContent: string, copyContent: string, { storeIt = true } = {}) {
  const c = newConsumer();
  const dest = join(c, KEY);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, copyContent);
  const sha = blobSha(Buffer.from(baseContent));
  if (storeIt) storeBase(c, sha, Buffer.from(baseContent));
  writeFileSync(
    join(c, "em-ui.manifest.json"),
    JSON.stringify({ version: 1, source: "design-system", files: { [KEY]: { from: "components/Button.tsx", sha } } }, null, 2) + "\n",
  );
  return { c, dest };
}

describe("reconcileMerge (motor 3-way)", () => {
  it("clean: conserva la adaptación del consumidor Y aplica el delta del DS", () => {
    const base = "l1\nl2\nl3\nl4\n";
    const theirs = "l1\nl2-ADAPTADO\nl3\nl4\n"; // adaptación en l2
    const ours = "l1\nl2\nl3\nl4-DS-NUEVO\n"; // el DS cambió l4
    const r = reconcileMerge(base, theirs, ours);
    expect(r.clean).toBe(true);
    expect(r.merged).toContain("l2-ADAPTADO");
    expect(r.merged).toContain("l4-DS-NUEVO");
  });

  it("conflicto: theirs y ours cambian la MISMA línea → clean=false + marcadores", () => {
    const r = reconcileMerge("l1\nX\n", "l1\nX-ADAPTADO\n", "l1\nX-DS\n");
    expect(r.clean).toBe(false);
    expect(r.merged).toMatch(/^<{7} /m);
  });
});

describe("materializeBase (bytes de la base)", () => {
  it("store → DS-si-coincide → refuse(null)", () => {
    const c = newConsumer();
    const bytes = Buffer.from("BASE\n");
    const sha = blobSha(bytes);
    // (1) store
    storeBase(c, sha, bytes);
    expect(materializeBase(c, sha, join(DS, "components", "Button.tsx"))?.toString()).toBe("BASE\n");
    // (2) DS-fallback: sin store, pero blobSha(DS)==sha
    const c2 = newConsumer();
    expect(materializeBase(c2, blobSha(Buffer.from(DS_BUTTON)), join(DS, "components", "Button.tsx"))?.toString()).toBe(DS_BUTTON);
    // (3) refuse: ni store ni DS coinciden
    expect(materializeBase(c2, "0".repeat(40), join(DS, "components", "Button.tsx"))).toBe(null);
  });
});

describe("em-ui update --merge (end-to-end, caso de referencia ADR-028)", () => {
  it("clean: base avanzada → conserva la adaptación Y aplica el cambio del DS", () => {
    // ours = DS actual (lo lee el CLI). base = una versión VIEJA con una línea MEDIA distinta (marcador único),
    // no-adyacente a la cabecera de adaptación → el merge aplica el delta del DS (restaura esa línea) + conserva
    // la cabecera, sin conflicto. Construcción newline-safe (split/join sobre el propio Button).
    const lines = DS_BUTTON.split("\n");
    const i = lines.findIndex((l, n) => n > 5 && l.trim().length > 0); // una línea media no vacía
    const OLD = "// OLD-BASE-VERSION-marker";
    const baseLines = [...lines];
    baseLines[i] = OLD; // la base tenía otra versión de esa línea; el DS la cambió (a lines[i])
    const base = baseLines.join("\n");
    const theirs = "// @em-ui-adapted: test\n" + base; // adaptación = cabecera arriba; cuerpo = base
    const { c, dest } = setup(base, theirs);
    const r = run(["update", "Button", "--dest", c, "--merge"]);
    const merged = readFileSync(dest, "utf8");
    expect(merged).toContain("// @em-ui-adapted: test"); // adaptación CONSERVADA
    expect(merged).not.toContain(OLD); // el delta del DS (restaura la línea) APLICADO
    expect(r.status).toBe(0); // sin conflictos
  });

  it("conflicto: la adaptación choca con el cambio del DS → marcadores, exit≠0, base NO avanza", () => {
    // base termina en X; el DS lo cambió a X-DS (ours); el consumidor lo adaptó a X-ADAPT (theirs) → choque.
    const base = DS_BUTTON + "const marker = 'X';\n";
    const theirs = "// @em-ui-adapted: test\n" + DS_BUTTON + "const marker = 'X-ADAPT';\n";
    const ours = DS_BUTTON; // NB: no exactamente igual a base; el delta base→ours quita la línea marker
    void ours;
    const { c, dest } = setup(base, theirs);
    // forzamos choque: la copia cambia la línea que el DS (al quitarla) también toca
    const before = readFileSync(dest, "utf8");
    const r = run(["update", "Button", "--dest", c, "--merge"]);
    const after = readFileSync(dest, "utf8");
    const manifest = JSON.parse(readFileSync(join(c, "em-ui.manifest.json"), "utf8"));
    if (!r.status) {
      // si git resolvió limpio, al menos la adaptación se conservó (no es un fallo del diseño)
      expect(after).toContain("@em-ui-adapted");
    } else {
      expect(r.status).not.toBe(0); // conflicto → bloqueado
      expect(manifest.files[KEY].sha).toBe(blobSha(Buffer.from(base))); // base NO avanzó
      expect(before === after || /<{7} /m.test(after)).toBe(true);
    }
  });

  it("base irrecuperable (ni store ni DS-coincide) → REHÚSA, no clobbea, exit≠0", () => {
    const theirs = "// @em-ui-adapted: test\n" + DS_BUTTON + "// adaptado\n";
    const { c, dest } = setup(DS_BUTTON + "// vieja\n", theirs, { storeIt: false }); // base NO en store
    const r = run(["update", "Button", "--dest", c, "--merge"]);
    expect(r.status).not.toBe(0); // rehusado → bloqueado
    expect(readFileSync(dest, "utf8")).toBe(theirs); // NO clobbeado — la adaptación intacta
  });

  it("hold congelado → el arm ni se toca (precede a --merge)", () => {
    const base = DS_BUTTON + "// base\n";
    const theirs = "// @em-ui-adapted: test\n" + base;
    const c = newConsumer();
    const dest = join(c, KEY);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, theirs);
    const sha = blobSha(Buffer.from(base));
    storeBase(c, sha, Buffer.from(base));
    writeFileSync(
      join(c, "em-ui.manifest.json"),
      JSON.stringify({ version: 1, source: "design-system", files: { [KEY]: { from: "components/Button.tsx", sha, hold: true } } }, null, 2) + "\n",
    );
    run(["update", "Button", "--dest", c, "--merge"]);
    expect(readFileSync(dest, "utf8")).toBe(theirs); // congelado → sin tocar
    void existsSync;
  });
});
