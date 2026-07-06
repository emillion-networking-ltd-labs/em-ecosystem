import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { blobSha, classifyEntry, STATUS, isRedStatus, fleetStatus, governedSources } from "../registry/_manifest.mjs";

// ECO-155 (design-propagation Fase 1 E4b) — reporter de flota pull-only + halt-on-red.
// Cubre el clasificador de sync (todos los estados: held/adapted NO rojo, drifted/conflict SÍ) y el reporter de
// flota (report-all: reporta TODOS los consumidores aunque el 1º esté rojo — NO para en el 1er rojo — y marca
// rojo si alguno lo está, que es lo que dispara el exit ≠0 del verbo/gate).

const DS = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY = JSON.parse(readFileSync(join(DS, "registry.json"), "utf8"));
const SOURCES = governedSources(REGISTRY);
const badgeBuf = readFileSync(join(DS, "components", "Badge.tsx"));
const tokensBuf = readFileSync(join(DS, "tokens", "tokens.css"));

const tmps: string[] = [];
type Copy = { from: string; sha: string; hold?: boolean; bytes: Buffer | string };
function makeConsumer(files: Record<string, Copy>): string {
  const root = mkdtempSync(join(tmpdir(), "em-ui-fleet-"));
  mkdirSync(join(root, "src"), { recursive: true });
  const manifest: { version: number; source: string; files: Record<string, unknown> } = {
    version: 1,
    source: "design-system",
    files: {},
  };
  for (const [key, f] of Object.entries(files)) {
    const dest = join(root, "src", key);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, f.bytes);
    manifest.files[key] = f.hold ? { from: f.from, sha: f.sha, hold: true } : { from: f.from, sha: f.sha };
  }
  writeFileSync(join(root, "src", "em-ui.manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  tmps.push(root);
  return root;
}
afterEach(() => {
  for (const t of tmps.splice(0)) rmSync(t, { recursive: true, force: true });
});

describe("classifyEntry (clasificador de sync)", () => {
  const base = Buffer.from("BASE CONTENT\n");
  const baseSha = blobSha(base);

  it("up-to-date: fiel a la base y la base == DS actual", () => {
    expect(classifyEntry({ from: "x", sha: baseSha }, baseSha, base)).toBe(STATUS.UP_TO_DATE);
  });

  it("stale (ámbar, no rojo): fiel a la base pero el DS avanzó", () => {
    const s = classifyEntry({ from: "x", sha: baseSha }, blobSha(Buffer.from("NEWER DS\n")), base);
    expect(s).toBe(STATUS.STALE);
    expect(isRedStatus(s)).toBe(false);
  });

  it("drifted (ROJO): diverge de la base sin declararlo", () => {
    const s = classifyEntry({ from: "x", sha: baseSha }, baseSha, Buffer.from("EDIT NO DECLARADO\n"));
    expect(s).toBe(STATUS.DRIFTED);
    expect(isRedStatus(s)).toBe(true);
  });

  it("adapted (no rojo): diverge pero lo declara @em-ui-adapted en la cabecera", () => {
    const s = classifyEntry({ from: "x", sha: baseSha }, baseSha, Buffer.from("// @em-ui-adapted: x\nEDIT\n"));
    expect(s).toBe(STATUS.ADAPTED);
    expect(isRedStatus(s)).toBe(false);
  });

  it("held (no rojo): congelado gana a stale/drift", () => {
    const s = classifyEntry({ from: "x", sha: baseSha, hold: true }, blobSha(Buffer.from("NEW\n")), Buffer.from("EDIT\n"));
    expect(s).toBe(STATUS.HELD);
    expect(isRedStatus(s)).toBe(false);
  });

  it("conflict (ROJO): los marcadores de conflicto ganan incluso a hold (rompen el build)", () => {
    const s = classifyEntry({ from: "x", sha: baseSha, hold: true }, baseSha, Buffer.from("a\n<<<<<<< HEAD\nb\n"));
    expect(s).toBe(STATUS.CONFLICT);
    expect(isRedStatus(s)).toBe(true);
  });
});

describe("fleetStatus (reporter de flota: report-all + halt-on-red)", () => {
  it("reporta TODOS los consumidores aunque el 1º esté ROJO (no para en el 1er rojo) y marca rojo el roto", () => {
    // Consumidor A: drift NO declarado → ROJO.
    const a = makeConsumer({
      "components/ui/Button.tsx": {
        from: "components/Button.tsx",
        sha: blobSha(Buffer.from("BASE VIEJA\n")),
        bytes: "EDIT SIN DECLARAR\n",
      },
    });
    // Consumidor B: up-to-date + held + tokens up-to-date → NO rojo (incl. la capa de tokens, clave especial).
    const b = makeConsumer({
      "components/ui/Badge.tsx": { from: "components/Badge.tsx", sha: blobSha(badgeBuf), bytes: badgeBuf },
      "components/ui/Button.tsx": { from: "components/Button.tsx", sha: blobSha(Buffer.from("base\n")), hold: true, bytes: "lo que sea\n" },
      "styles/em-ui-tokens.css": { from: "tokens/tokens.css", sha: blobSha(tokensBuf), bytes: tokensBuf },
    });

    const fleet = fleetStatus(SOURCES, DS, [a, b]);
    expect(fleet.length).toBe(2); // report-all: ambos presentes aunque A sea rojo (no se corta en el 1er rojo)

    const ra = fleet.find((c) => c.root === a)!;
    const rb = fleet.find((c) => c.root === b)!;
    expect(ra.red).toBe(true); // drift no declarado
    expect(ra.worst).toBe(STATUS.DRIFTED);
    expect(rb.red).toBe(false); // up-to-date + held + tokens up-to-date
    expect(fleet.filter((c) => c.red).length).toBe(1); // ≥1 rojo → el verbo/gate salen ≠0
  });
});
