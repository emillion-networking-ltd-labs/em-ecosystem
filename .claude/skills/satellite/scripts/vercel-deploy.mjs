// Preparador Vercel (ECO-28, Q1/Q3): proyecto Vercel apuntando a la carpeta del satélite en el
// monorepo + deploy. Modela el flujo del runbook (docs/satellite-deployment-runbook.md): framework
// nextjs, rootDirectory, Ignored Build Step, nodeVersion 22.x, y el gotcha del primer deploy.
// Q1 = monorepo (NO repo nuevo). Q3 = team empresarial por defecto | cuenta-cliente pluggable.
// Solo construye el PLAN; el deploy es outward-facing → bajo --apply.

const MONOREPO = "emillionnetworking-ltd-labs/em-ecosystem";
const IGNORED_BUILD_STEP = "git diff HEAD^ HEAD --quiet ./";

export function vercelActions(slug, satelliteDir, target) {
  const name = `sat-${slug}`;
  const createProject = {
    name,
    framework: "nextjs",
    rootDirectory: satelliteDir,              // Q1: carpeta del satélite en el monorepo
    gitRepository: { type: "github", repo: MONOREPO },
    commandForIgnoringBuildStep: IGNORED_BUILD_STEP,
    _target: { mode: target.mode, teamId: target.teamId, tokenSource: target.tokenSource }, // Q3 (token NUNCA en payload)
  };
  return [
    { op: "vercel.createProject", payload: createProject },
    { op: "vercel.patchProject", payload: { name, nodeVersion: "22.x" } }, // nodeVersion no se puede en create
    // Gotcha del primer deploy (runbook §1.5): desactivar Ignored Build Step → deploy → reactivar.
    { op: "vercel.patchProject", payload: { name, commandForIgnoringBuildStep: null, _why: "bypass primer-deploy (runbook §1.5)" } },
    { op: "vercel.deploy", payload: { project: name, target: "production", ref: "main" } },
    { op: "vercel.patchProject", payload: { name, commandForIgnoringBuildStep: IGNORED_BUILD_STEP, _why: "reactivar tras primer deploy" } },
  ];
}
