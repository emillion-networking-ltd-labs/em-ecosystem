// Selección de DB ENDURECIDA (G1, ECO-73 — "endurecer el adapter"). INVARIANTE: el adapter JAMÁS elige la base
// de datos por TAMAÑO. Reproduce el caso REAL de Grupo Atis (dos DBs en el backup: PRODUCCIÓN grupoatis.com vs
// DEV dvp-grupoatis.emillion.link) de forma DETERMINISTA (los dumps reales están gitignored), y hace al dev MÁS
// GRANDE — el escenario donde el viejo "coge el .sql más grande" acertaba de chiripa y un dev mayor habría cogido
// la equivocada EN SILENCIO. Producción se elige por DOMINIO (siteurl); si es ambiguo, FALLA RUIDOSO.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { selectDump } from "../scripts/builders/capture/adapters/wordpress.mjs";

const optionsSql = (siteurl) => `INSERT INTO \`wp_options\` VALUES (1,'siteurl','${siteurl}','yes'),(2,'home','${siteurl}','yes');\n`;

// Backup con DOS .sql: producción (pequeño) + dev (MÁS GRANDE). dirName = la carpeta del intake (por convención
// .satellite-intake/<dominio>/, el basename es el dominio real → hint por defecto).
function twoDbBackup({ dirName = "grupoatis.com" } = {}) {
  const baseTmp = mkdtempSync(join(tmpdir(), "intake-"));
  const dir = join(baseTmp, dirName);
  mkdirSync(dir, { recursive: true });
  const prod = join(dir, "u_grupo_atis_db.sql");
  const dev = join(dir, "u_dvp_atisg_db.sql");
  writeFileSync(prod, optionsSql("https://grupoatis.com"));                                          // PRODUCCIÓN (pequeña)
  writeFileSync(dev, optionsSql("https://dvp-grupoatis.emillion.link") + "-- pad " + "x".repeat(40000)); // DEV (MÁS GRANDE)
  // sanity del fixture: el dev DEBE pesar más que prod (si no, el test no probaría "nunca por tamaño")
  assert.ok(statSync(dev).size > statSync(prod).size, "fixture: el dev debe ser MÁS grande que prod");
  return { dir, prod, dev, cleanup: () => rmSync(baseTmp, { recursive: true, force: true }) };
}

test("selectDump: dos DBs (Atis) → elige PRODUCCIÓN por dominio (basename), NUNCA la dev más grande", async () => {
  const bk = twoDbBackup();   // basename = grupoatis.com (la convención .satellite-intake/<dominio>/)
  try {
    const chosen = await selectDump(bk.dir);
    assert.equal(chosen, bk.prod, "debe elegir la DB de producción (grupoatis.com)");
    assert.notEqual(chosen, bk.dev, "JAMÁS la dev por ser más grande");
  } finally { bk.cleanup(); }
});

test("selectDump: hint explícito --domain elige producción aunque el dir NO sea el dominio", async () => {
  const bk = twoDbBackup({ dirName: "backup-cliente" });   // basename NO es dominio → sin el hint explícito sería ambiguo
  try {
    assert.equal(await selectDump(bk.dir, { targetDomain: "grupoatis.com" }), bk.prod);
  } finally { bk.cleanup(); }
});

test("selectDump: AMBIGUO (sin dominio resoluble) → FALLA RUIDOSO listando las DBs + sus siteurl", async () => {
  const bk = twoDbBackup({ dirName: "backup-cliente" });   // ni basename-dominio ni --domain
  try {
    await assert.rejects(() => selectDump(bk.dir), (e) => {
      assert.equal(e.code, "AMBIGUOUS_DB");
      assert.match(e.message, /grupoatis\.com/);                    // siteurl de producción listado
      assert.match(e.message, /dvp-grupoatis\.emillion\.link/);     // siteurl de dev listado
      assert.match(e.message, /u_grupo_atis_db\.sql/);              // nombre de fichero listado
      assert.match(e.message, /JAMÁS elijo por tamaño/);            // declara el invariante
      return true;
    });
  } finally { bk.cleanup(); }
});

test("selectDump: hint que no casa NINGUNA DB → FALLA RUIDOSO (no elige a ciegas)", async () => {
  const bk = twoDbBackup({ dirName: "backup-cliente" });
  try {
    await assert.rejects(() => selectDump(bk.dir, { targetDomain: "otrodominio.com" }), (e) => e.code === "AMBIGUOUS_DB");
  } finally { bk.cleanup(); }
});

test("selectDump: un solo .sql → se usa (sin ambigüedad, sin pre-scan de dominio)", async () => {
  const baseTmp = mkdtempSync(join(tmpdir(), "intake1-"));
  const dir = join(baseTmp, "x"); mkdirSync(dir, { recursive: true });
  const only = join(dir, "db.sql"); writeFileSync(only, optionsSql("https://whatever.test"));
  try { assert.equal(await selectDump(dir), only); } finally { rmSync(baseTmp, { recursive: true, force: true }); }
});
