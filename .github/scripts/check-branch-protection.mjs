#!/usr/bin/env node
// ECO-126 — Guardia anti-deriva de la branch protection de `main`.
//
// Contexto: los PRs de bump mensual de Dependabot (#515 prettier, #516 integrity) se auto-mergearon EN
// ROJO porque el único required check de `main` era el de gobernanza; el `Security Gate` del
// pipeline de seguridad NO estaba marcado required — la config de GitHub había derivado del intent (el
// propio dependabot-auto-merge.yml afirma que "la branch protection dispara solo cuando gates + Security
// Gate pasan"). `gh pr merge --auto` mergea en cuanto pasan los REQUIRED checks → un gate no-required no
// bloquea nada.
//
// Este script codifica el intent (qué checks DEBEN ser required + strict) y falla si la config viva
// derivó. La lógica de comparación es pura (`findDrift`) y se testea con fixtures (sin red) en el job
// `Gate self-tests`. El modo CLI la corre contra la config VIVA (necesita un token con permiso admin →
// weekly-audit / operador local); si no puede leerla, sale 2 (warn) en vez de dar un falso verde.

import { execFileSync } from "node:child_process";

// El intent. Solo se exigen checks que corren en CADA PR a main (si no, strict + required + "nunca corre"
// deja PRs bloqueados para siempre):
//   - code-health                  → code-health.yml (ratchet propio del repo), corre en cada PR.
//   - Security Gate (All Checks)   → agregador de security.yml; su needs:+result-checks propagan cualquier
//                                    capa en rojo → un solo required cubre las 5 capas y resiste renombres.
//   - Dashboard visual regression  → visual-regression.yml, SIN paths-filter a propósito (ECO-38): corre
//                                    siempre (verde por skip) → seguro de requerir.
//   - Satellite visual regression (all) → visual-regression.yml (ECO-157/E4c): agregador de nombre ESTÁTICO
//                                    del matrix por-satélite. Los nombres del matrix son DINÁMICOS (incluyen el
//                                    dir del satélite) → NO requeribles directamente. needs:+result FAIL-ONLY
//                                    (falla en failure/cancelled, pasa en success Y skipped) → un context cubre
//                                    toda la flota, verde por green-skip en PRs ajenas. La guardia de propagación.
//   - Conflict markers             → conflict-markers.yml (ECO-157/E4c): always-run, SIN paths-filter; el
//                                    subconjunto DETERMINISTA-y-DURO (un marcador de conflicto git rompe el
//                                    build) que complementa el reporter de flota advisory de E4b, para no
//                                    endurecer solo la señal flaky (VRT) y dejar la fiable en advisory.
// Storybook (design-system-storybook.yml) queda FUERA a propósito: tiene paths-filter `design-system/**` y
// design-system NO está en dependabot.yml → requerirlo bloquearía justo los PRs de Dependabot.
export const EXPECTED = {
  strict: true,
  contexts: [
    "code-health",
    "Security Gate (All Checks)",
    "Dashboard visual regression",
    "Satellite visual regression (all)",
    "Conflict markers",
  ],
};

/** Normaliza los contexts de un objeto de protección de GitHub (soporta el shape viejo `contexts`
 *  y el nuevo `checks[].context`). Devuelve un Set de strings. */
export function extractContexts(protection) {
  const rsc = protection?.required_status_checks;
  if (!rsc) return new Set();
  const fromChecks = Array.isArray(rsc.checks) ? rsc.checks.map((c) => c.context) : [];
  const fromContexts = Array.isArray(rsc.contexts) ? rsc.contexts : [];
  return new Set([...fromChecks, ...fromContexts].filter(Boolean));
}

/** Compara la protección viva contra el intent. Devuelve una lista de problemas (vacía = OK).
 *  Contexts EXTRA no se marcan (endurecer de más no es deriva peligrosa); faltar uno o strict:false sí. */
export function findDrift(protection, expected = EXPECTED) {
  const problems = [];
  const rsc = protection?.required_status_checks;
  if (!rsc) {
    problems.push("required_status_checks no está configurado en la branch protection");
    return problems;
  }
  if (rsc.strict !== expected.strict) {
    problems.push(
      `required_status_checks.strict = ${rsc.strict} (se espera ${expected.strict}: rama al día con main antes de mergear)`,
    );
  }
  const have = extractContexts(protection);
  for (const ctx of expected.contexts) {
    if (!have.has(ctx)) problems.push(`falta required check: "${ctx}"`);
  }
  return problems;
}

// ---- CLI ---------------------------------------------------------------------
// Uso: node check-branch-protection.mjs [owner/repo] [branch]
// Sale 0 = OK · 1 = deriva detectada · 2 = no se pudo verificar (sin permiso admin / sin gh).
function main() {
  const repo = process.argv[2] || process.env.GITHUB_REPOSITORY || "emillionnetworking-ltd-labs/em-ecosystem";
  const branch = process.argv[3] || "main";
  let raw;
  try {
    raw = execFileSync("gh", ["api", `repos/${repo}/branches/${branch}/protection`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (err) {
    const msg = (err.stderr || err.message || "").toString();
    console.log(
      `::warning::No se pudo leer la branch protection de ${repo}@${branch} (¿token sin permiso admin?). ` +
        `La guardia no puede verificar la deriva. Detalle: ${msg.trim().split("\n").pop()}`,
    );
    process.exit(2);
  }
  const problems = findDrift(JSON.parse(raw));
  if (problems.length) {
    console.log(`::error::Branch protection de ${repo}@${branch} ha DERIVADO del intent (ECO-126):`);
    for (const p of problems) console.log(`  - ${p}`);
    console.log(
      "Arréglalo con: gh api -X PATCH " +
        `repos/${repo}/branches/${branch}/protection/required_status_checks ` +
        `-F strict=true ${EXPECTED.contexts.map((c) => `-f 'contexts[]=${c}'`).join(" ")}`,
    );
    process.exit(1);
  }
  console.log(`✓ Branch protection de ${repo}@${branch} coincide con el intent (ECO-126).`);
}

// Solo corre el CLI cuando se invoca directamente (no al importarlo desde el test).
if (import.meta.url === `file://${process.argv[1]}`) main();
