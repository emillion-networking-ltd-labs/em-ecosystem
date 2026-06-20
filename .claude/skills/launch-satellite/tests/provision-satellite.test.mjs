import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { generateSatellite } from "../scripts/generate-satellite.mjs";
import { buildPlan, provision } from "../scripts/provision-satellite.mjs";
import { executePlan, recordingBoundary, readEnvSecrets, resolveVercelTarget } from "../scripts/lib/provision.mjs";
import { projectKey } from "../scripts/jira-project.mjs";
import { SCHEMA_VERSION, field } from "../scripts/lib/brief.mjs";

const brief = {
  schemaVersion: SCHEMA_VERSION, intakeMode: "a-no-design",
  identity: { name: field("Estudio Aurora", "provided"), sector: field("estudio", "provided"), language: field("es", "provided") },
  fields: { contactPhone: field("+34 600 111 222", "provided") },
  targetRoutes: ["/", "/contacto"],
};

let dir;
before(() => { dir = join(mkdtempSync(join(tmpdir(), "prov-")), "sat-aurora"); generateSatellite(brief, dir); });
after(() => { try { rmSync(dirname(dir), { recursive: true, force: true }); } catch {} });

// Boundary que LANZA si se le llama → prueba que el dry-run NUNCA toca recursos reales.
const throwing = {
  jira: { createProject: () => { throw new Error("REAL Jira llamado!"); }, createIssue: () => { throw new Error("REAL Jira!"); } },
  vercel: { createProject: () => { throw new Error("REAL Vercel!"); }, patchProject: () => { throw new Error("REAL Vercel!"); }, deploy: () => { throw new Error("REAL Vercel deploy!"); } },
};

test("buildPlan: plan correcto (proyecto Jira nuevo + Vercel rootDirectory + deploy)", () => {
  const plan = buildPlan(dir);
  const ops = plan.actions.map((a) => a.op);
  assert.ok(ops.includes("jira.createProject"), "crea proyecto Jira (Q2)");
  assert.equal(ops.filter((o) => o === "jira.createIssue").length, 3, "3 tickets S1/S2/S3");
  const vc = plan.actions.find((a) => a.op === "vercel.createProject");
  assert.equal(vc.payload.rootDirectory, dir, "Vercel rootDirectory = carpeta del satélite (Q1 monorepo)");
  assert.equal(vc.payload.framework, "nextjs");
  assert.ok(ops.includes("vercel.deploy"), "incluye deploy");
  assert.match(projectKey(plan.slug), /^[A-Z][A-Z0-9]{0,9}$/, "key Jira válida");
});

// AC: dry-run NO crea recursos reales.
test("dry-run NO ejecuta nada externo (boundary real nunca se llama)", () => {
  const plan = buildPlan(dir);
  const r = executePlan(plan, { apply: false, boundary: throwing }); // pasa el throwing; dry-run debe ignorarlo
  assert.equal(r.mode, "dry-run");
  assert.equal(r.executed, false);
  assert.ok(r.intended.length >= 5, "registra las acciones intencionadas, sin ejecutarlas");
});

test("provision() por defecto es dry-run (sin --apply)", async () => {
  const r = await provision(dir, {});
  assert.equal(r.mode, "dry-run");
  assert.equal(r.executed, false);
  assert.ok(Array.isArray(r.plan.checklist) && r.plan.checklist.length > 0, "incluye checklist de provisión");
});

// AC: --apply requiere confirmación humana.
test("--apply SIN confirmación lanza (nada ejecutado)", () => {
  const plan = buildPlan(dir);
  assert.throws(() => executePlan(plan, { apply: true, confirm: false, boundary: recordingBoundary() }), /confirmaci/i);
});

test("--apply CON confirmación ejecuta contra el boundary (mock, sin APIs reales)", () => {
  const plan = buildPlan(dir);
  const mock = recordingBoundary();
  const r = executePlan(plan, { apply: true, confirm: true, boundary: mock });
  assert.equal(r.executed, true);
  assert.equal(mock.calls.length, plan.actions.length, "ejecuta todas las acciones del plan");
});

// AC: secrets desde el entorno; el token NUNCA aparece en el payload del plan.
test("secrets desde env; target Vercel default vs cuenta-cliente pluggable", () => {
  const s = readEnvSecrets({ VERCEL_TOKEN: "t", VERCEL_TEAM_ID: "team_x", JIRA_BASE_URL: "u", JIRA_EMAIL: "e", JIRA_TOKEN: "j" });
  assert.equal(s.vercelToken, "t");
  const def = resolveVercelTarget({}, { VERCEL_TOKEN: "t", VERCEL_TEAM_ID: "team_x" });
  assert.equal(def.mode, "enterprise-default");
  const cli = resolveVercelTarget({ vercelClientToken: "CLIENT" }, {});
  assert.equal(cli.mode, "client-account");
  // el plan no filtra el token: el payload de Vercel solo lleva tokenSource, no el token.
  const vc = buildPlan(dir, { vercelClientToken: "CLIENT" }).actions.find((a) => a.op === "vercel.createProject");
  assert.ok(!JSON.stringify(vc.payload).includes("CLIENT"), "el token del cliente NUNCA va en el plan/payload");
});
