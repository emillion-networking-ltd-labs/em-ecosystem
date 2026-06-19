// Preparador Jira (ECO-28, Q2): PROYECTO NUEVO E INDEPENDIENTE por satélite + tickets de creación.
// Solo construye el PLAN (acciones para el boundary); crear el proyecto es outward-facing → bajo --apply.

// Deriva una key de proyecto Jira válida (mayúsculas, empieza por letra, ≤10) desde el slug.
export function projectKey(slug) {
  const base = String(slug).toUpperCase().replace(/[^A-Z0-9]/g, "");
  let key = base.replace(/^[^A-Z]+/, "") || "SAT";
  key = key.slice(0, 10);
  if (!/^[A-Z]/.test(key)) key = "S" + key.slice(0, 9);
  return key;
}

// Acciones Jira para el plan: crear proyecto + los tickets de creación del satélite (S1/S2/S3).
export function jiraActions(slug, displayName) {
  const key = projectKey(slug);
  const project = {
    key,
    name: `Satélite — ${displayName}`,
    projectTypeKey: "software",
    // assigneeType/leadAccountId/template los completa el operador en --apply (permisos/plantilla).
    _note: "proyecto NUEVO e independiente (Q2)",
  };
  const tickets = [
    { summary: `${displayName} — S1 Setup & Landing`, description: "Scaffold + landing (forma satélite F2)." },
    { summary: `${displayName} — S2 Production Hardening`, description: "S2-ready: cabeceras/SEO/observabilidad + Lighthouse." },
    { summary: `${displayName} — S3 Launch`, description: "Deploy Vercel + dominio + Lighthouse remoto = lanzado." },
  ];
  return [
    { op: "jira.createProject", payload: project },
    ...tickets.map((t) => ({ op: "jira.createIssue", payload: { projectKey: key, ...t } })),
  ];
}
