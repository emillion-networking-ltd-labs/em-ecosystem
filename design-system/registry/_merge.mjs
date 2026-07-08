// _merge.mjs — motor de reconciliación a 3 bandas de em-ui (ECO-158, design-propagation item 1).
// Interfaz CONTENIDO→CONTENIDO (testeable): recibe los 3 textos (base / theirs=copia adaptada del consumidor /
// ours=fuente DS actual) y devuelve el merge. Hace IO acotado (ficheros temp en el tmpdir del SO — NUNCA en el
// árbol del consumidor) + `git merge-file`. El shell (cli.mjs) le da los textos y decide qué escribir.
//
// `git merge-file -p --diff3 <theirs> <base> <ours>` = incorpora los cambios base→ours (el delta del DS) DENTRO
// de theirs (la adaptación del consumidor) → la adaptación se conserva Y recibe la mejora del DS. `-p` imprime a
// stdout sin tocar ficheros; exit 0 = limpio, exit>0 = nº de conflictos (stdout lleva los marcadores diff3).

import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Devuelve { clean: bool, merged: string }. clean=false → `merged` lleva marcadores de conflicto estándar que
// un humano resuelve. Puro en contrato (mismos inputs → mismo output); el IO (temp + subproceso) es interno.
export function reconcileMerge(baseContent, theirsContent, oursContent) {
  const dir = mkdtempSync(join(tmpdir(), "em-ui-merge-"));
  try {
    const bf = join(dir, "base");
    const tf = join(dir, "theirs");
    const of = join(dir, "ours");
    writeFileSync(bf, baseContent);
    writeFileSync(tf, theirsContent);
    writeFileSync(of, oursContent);
    try {
      const merged = execFileSync("git", ["merge-file", "-p", "--diff3", tf, bf, of], { encoding: "utf8" });
      return { clean: true, merged };
    } catch (e) {
      // git merge-file sale ≠0 = nº de conflictos; stdout SÍ tiene el contenido fusionado con marcadores.
      const merged = (e.stdout ?? "").toString();
      return { clean: false, merged };
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
