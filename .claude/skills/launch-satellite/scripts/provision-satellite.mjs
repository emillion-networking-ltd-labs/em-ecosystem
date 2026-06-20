#!/usr/bin/env node
// Orquestador de provisión /launch-satellite (ECO-28, F3b). Dado un satélite generado (F2), PREPARA:
// (a) proyecto Jira nuevo + tickets (Q2); (b) proyecto + deploy Vercel (Q1/Q3); (c) checklist.
// DRY-RUN POR DEFECTO (ADR-009 Q4): nada outward-facing se ejecuta sin --apply + confirmación humana.
// El --apply real lo dispara el HUMANO (no en CI). Lighthouse remoto = "lanzado" (script aparte).
import { existsSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { readEnvSecrets, resolveVercelTarget, executePlan } from "./lib/provision.mjs";
import { jiraActions, projectKey } from "./jira-project.mjs";
import { vercelActions } from "./vercel-deploy.mjs";

// Construye el PLAN (puro, sin efectos) a partir del satélite generado por F2.
export function buildPlan(satelliteDir, opts = {}, env = process.env) {
  const dir = satelliteDir.replace(/\/+$/, "");
  const pkgPath = join(resolve(dir), "package.json");
  if (!existsSync(pkgPath)) throw new Error(`no parece un satélite (falta ${dir}/package.json) — genéralo con F2 primero`);
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  const slug = (pkg.name || basename(dir)).replace(/^@em-ecosystem\/sat-/, "").replace(/^sat-/, "");
  const displayName = opts.displayName || slug;
  const target = resolveVercelTarget(opts, env);

  const actions = [...jiraActions(slug, displayName), ...vercelActions(slug, dir, target)];
  const checklist = [
    `Revisar el satélite generado en ${dir}/ (F2: build + Lighthouse local verdes).`,
    `Jira (Q2): se creará un PROYECTO NUEVO key=${projectKey(slug)} + 3 tickets (S1/S2/S3). Confirmar permisos/plantilla.`,
    `Vercel (Q1/Q3): proyecto sat-${slug} → rootDirectory ${dir}, Ignored Build Step, target=${target.mode} (${target.tokenSource}).`,
    `Primer deploy: aplicar el bypass del Ignored Build Step (runbook §1.5) — incluido en el plan.`,
    `Tras el deploy: 'node lighthouse-remote.mjs <url>' (S2 remoto = LANZADO).`,
    `Ejecutar de verdad SOLO con: --apply --confirm (operación humana; secrets desde el entorno).`,
  ];
  return { satellite: dir, slug, displayName, target: { mode: target.mode, teamId: target.teamId, tokenSource: target.tokenSource }, actions, checklist };
}

// Boundary REAL (solo se construye en --apply). Lee secrets del entorno; hace las llamadas API.
// NO se usa en CI/tests (allí solo corre dry-run). Implementación mínima vía fetch.
function realBoundary(env = process.env, target) {
  const s = readEnvSecrets(env);
  const jiraAuth = "Basic " + Buffer.from(`${s.jiraEmail}:${s.jiraToken}`).toString("base64");
  const vToken = target._token; // token en runtime (default env o cuenta-cliente); NUNCA se persiste
  const vTeam = target.teamId ? `?teamId=${target.teamId}` : "";
  const must = (c, m) => { if (!c) throw new Error(m); };
  return {
    jira: {
      createProject: async (p) => { must(s.jiraBaseUrl && s.jiraToken, "faltan secrets Jira en el entorno"); return api(`${s.jiraBaseUrl}/rest/api/3/project`, jiraAuth, p); },
      createIssue: async (p) => api(`${s.jiraBaseUrl}/rest/api/3/issue`, jiraAuth, p),
    },
    vercel: {
      createProject: async (p) => { must(vToken, "falta token Vercel (env o cuenta-cliente)"); return api(`https://api.vercel.com/v11/projects${vTeam}`, `Bearer ${vToken}`, p); },
      patchProject: async (p) => api(`https://api.vercel.com/v9/projects/${p.name}${vTeam}`, `Bearer ${vToken}`, p, "PATCH"),
      deploy: async (p) => api(`https://api.vercel.com/v13/deployments${vTeam}`, `Bearer ${vToken}`, p),
    },
  };
}
async function api(url, auth, body, method = "POST") {
  const res = await fetch(url, { method, headers: { Authorization: auth, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${method} ${url} → ${res.status}`);
  return res.json();
}

export async function provision(satelliteDir, opts = {}, env = process.env) {
  const plan = buildPlan(satelliteDir, opts, env);
  if (!opts.apply) return { plan, ...executePlan(plan, { apply: false }) }; // dry-run: cero efectos
  const target = resolveVercelTarget(opts, env);
  return { plan, ...executePlan(plan, { apply: true, confirm: opts.confirm === true, boundary: realBoundary(env, target) }) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = process.argv[2];
  if (!dir) { console.error("uso: provision-satellite.mjs <satellite-dir> [--apply --confirm] [--vercel-client-token X]"); process.exit(2); }
  const argv = process.argv;
  const opts = {
    apply: argv.includes("--apply"),
    confirm: argv.includes("--confirm"),
    vercelClientToken: (argv[argv.indexOf("--vercel-client-token") + 1] || null) && argv.includes("--vercel-client-token") ? argv[argv.indexOf("--vercel-client-token") + 1] : null,
  };
  provision(dir, opts).then((r) => {
    if (r.mode === "dry-run") {
      console.log(`DRY-RUN (sin efectos) — satélite ${r.plan.slug}. Acciones que se EJECUTARÍAN con --apply --confirm:`);
      r.intended.forEach((a, i) => console.log(`  ${i + 1}. ${a.kind} ${JSON.stringify(a.payload).slice(0, 120)}`));
      console.log("\nChecklist de provisión:");
      r.plan.checklist.forEach((c) => console.log(`  - ${c}`));
    } else {
      console.log(`APLICADO (${r.results.length} acciones).`);
    }
  }).catch((e) => { console.error("ERROR:", e.message); process.exit(1); });
}
