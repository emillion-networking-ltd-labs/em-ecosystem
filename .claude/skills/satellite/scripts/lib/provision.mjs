// Lib compartida de provisión /satellite (ECO-28, F3b). Frontera AUTO/HUMANO (ADR-009 Q4):
// dry-run POR DEFECTO; ninguna acción outward-facing se ejecuta sin --apply explícito + confirmación
// humana. Boundary inyectable (real lee secrets de env; recording/mock para dry-run y tests).
// Secrets SIEMPRE del entorno — JAMÁS en el repo.

// Lee los secrets del entorno (Q3). Faltantes → null (en dry-run no se necesitan; en --apply se exigen).
export function readEnvSecrets(env = process.env) {
  return {
    vercelToken: env.VERCEL_TOKEN || null,        // nuestro team empresarial (default)
    vercelTeamId: env.VERCEL_TEAM_ID || null,
    jiraBaseUrl: env.JIRA_BASE_URL || null,
    jiraEmail: env.JIRA_EMAIL || null,
    jiraToken: env.JIRA_TOKEN || null,
  };
}

// Resuelve el target Vercel (Q3): default = nuestro team; pluggable = cuenta-cliente con token en
// RUNTIME (nunca almacenado). clientToken viene de --vercel-client-token o VERCEL_CLIENT_TOKEN.
export function resolveVercelTarget(opts = {}, env = process.env) {
  const clientToken = opts.vercelClientToken || env.VERCEL_CLIENT_TOKEN || null;
  if (clientToken) {
    return { mode: "client-account", tokenSource: "runtime (no almacenado)", teamId: opts.vercelClientTeamId || env.VERCEL_CLIENT_TEAM_ID || null, _token: clientToken };
  }
  const s = readEnvSecrets(env);
  return { mode: "enterprise-default", tokenSource: "env VERCEL_TOKEN (team-scoped)", teamId: s.vercelTeamId, _token: s.vercelToken };
}

// Boundary "recording": NO ejecuta nada externo; registra las acciones intencionadas (dry-run/tests).
export function recordingBoundary() {
  const calls = [];
  const rec = (kind) => (payload) => { calls.push({ kind, payload }); return { dryRun: true, kind, payload }; };
  return {
    calls,
    jira: { createProject: rec("jira.createProject"), createIssue: rec("jira.createIssue") },
    vercel: { createProject: rec("vercel.createProject"), patchProject: rec("vercel.patchProject"), deploy: rec("vercel.deploy") },
  };
}

// Ejecuta el plan respetando la frontera. apply=false → dry-run (usa recordingBoundary, cero efectos).
// apply=true → EXIGE confirm===true (confirmación humana) + un boundary real; si no, lanza (no ejecuta).
export function executePlan(plan, { apply = false, confirm = false, boundary } = {}) {
  if (!apply) {
    const rb = recordingBoundary();
    runActions(plan, rb);
    return { mode: "dry-run", executed: false, intended: rb.calls };
  }
  if (confirm !== true) throw new Error("--apply requiere confirmación humana explícita (confirm=true). Nada ejecutado.");
  if (!boundary) throw new Error("--apply requiere un boundary real (con secrets de env). Nada ejecutado.");
  const results = runActions(plan, boundary);
  return { mode: "apply", executed: true, results };
}

function runActions(plan, b) {
  const out = [];
  for (const a of plan.actions) {
    const [ns, fn] = a.op.split(".");
    if (!b[ns] || typeof b[ns][fn] !== "function") throw new Error(`boundary no soporta ${a.op}`);
    out.push({ op: a.op, result: b[ns][fn](a.payload) });
  }
  return out;
}
