// Lib compartida del onboarding /launch-satellite (ECO-24, F2a).
// Procedencia por campo + invariante DURA "no inventar". Sin deps externas.

export const SCHEMA_VERSION = "1.0.0";
export const PROVENANCE = Object.freeze(["provided", "extracted", "proposed", "missing"]);
export const INTAKE_MODES = Object.freeze([
  "a-no-design", "b-with-brand", "c-improve-site", "d-instagram", "e-inspiration",
]);
// Gate de FIDELIDAD del modo (c) (D4 del norte): la latitud creativa que el cliente elige.
export const INTENTS = Object.freeze(["a-replica", "b-remodel", "c-reimagine"]);
export const DEFAULT_INTENT = "b-remodel";   // "aporta valor… salvo que el cliente tenga otra idea"

// La fidelidad elegida en el brief, o el default si ausente (no se auto-impone: ausente = default explícito).
export function briefIntent(brief) {
  return INTENTS.includes(brief?.intent?.value) ? brief.intent.value : DEFAULT_INTENT;
}

// Núcleo del LOOP (D4): confirmar una sugerencia. Solo un `proposed` con valor se confirma → `provided`.
// No se puede "confirmar" un missing (sería inventar) ni un extracted (ya es un hecho real).
export function confirmField(f) {
  if (!f || f.provenance !== "proposed" || !hasValue(f.value)) {
    throw new Error("solo se confirma un 'proposed' con valor (proposed→provided)");
  }
  return { value: f.value, provenance: "provided" };
}

function hasValue(v) {
  if (v == null) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return true;
}

// Construye un campo con procedencia, aplicando la regla "no inventar":
// - extracted EXIGE source real.
// - missing NO puede llevar valor.
// - 'invented' no existe: cualquier valor sin fuente declarada => missing/proposed, jamas provided.
export function field(value, provenance, source) {
  if (!PROVENANCE.includes(provenance)) {
    throw new Error(`procedencia invalida: ${provenance} (¿'invented'? no existe)`);
  }
  if (provenance === "extracted" && !hasValue(source)) {
    throw new Error("provenance=extracted requiere 'source' (URL/handle real)");
  }
  if (provenance === "missing" && hasValue(value)) {
    throw new Error("provenance=missing no puede llevar valor (seria inventar)");
  }
  const f = { provenance };
  if (hasValue(value)) f.value = value;
  if (provenance === "extracted") f.source = source;
  return f;
}

// Valida un objeto-campo ya construido. Devuelve lista de problemas (vacia = ok).
export function fieldProblems(key, f) {
  const p = [];
  if (typeof f !== "object" || f === null) return [`${key}: campo no es objeto`];
  if (!PROVENANCE.includes(f.provenance)) {
    p.push(`${key}: procedencia "${f.provenance}" no valida (permitidas: ${PROVENANCE.join("|")}; 'invented' prohibida)`);
  }
  if (f.provenance === "extracted" && !hasValue(f.source)) {
    p.push(`${key}: 'extracted' sin 'source' real => dato sin fuente`);
  }
  if (f.provenance === "missing" && hasValue(f.value)) {
    p.push(`${key}: 'missing' con valor => invencion encubierta`);
  }
  // Regla AC#3: un valor concreto presentado como real (provided) es legitimo SOLO si lo dio el cliente;
  // un valor SIN fuente declarada no puede colarse como 'provided' via un 'source' vacio en extracted, etc.
  return p;
}

// Valida el brief completo (estructura + invariantes de procedencia). Devuelve {ok, problems}.
export function validateBrief(brief) {
  const problems = [];
  if (!brief || typeof brief !== "object") return { ok: false, problems: ["brief no es objeto"] };
  if (brief.schemaVersion !== SCHEMA_VERSION) problems.push(`schemaVersion debe ser ${SCHEMA_VERSION}`);
  if (!INTAKE_MODES.includes(brief.intakeMode)) problems.push(`intakeMode invalido: ${brief.intakeMode}`);
  if (!brief.identity || typeof brief.identity !== "object") {
    problems.push("falta identity");
  } else {
    for (const k of ["name", "sector", "language"]) {
      if (!(k in brief.identity)) problems.push(`identity.${k} ausente`);
      else problems.push(...fieldProblems(`identity.${k}`, brief.identity[k]));
    }
  }
  if (!brief.fields || typeof brief.fields !== "object") {
    problems.push("falta fields");
  } else {
    for (const [k, f] of Object.entries(brief.fields)) problems.push(...fieldProblems(`fields.${k}`, f));
  }
  // intent es OPCIONAL (ausente => default b-remodel). Si está, value ∈ INTENTS y lo elige/confirma el cliente.
  if (brief.intent !== undefined) {
    if (typeof brief.intent !== "object" || brief.intent === null) problems.push("intent no es objeto");
    else {
      if (!INTENTS.includes(brief.intent.value)) problems.push(`intent.value inválido: ${brief.intent.value} (permitidos: ${INTENTS.join("|")})`);
      if (!["provided", "proposed"].includes(brief.intent.provenance)) problems.push(`intent.provenance debe ser provided|proposed (lo elige el cliente), no "${brief.intent.provenance}"`);
    }
  }
  return { ok: problems.length === 0, problems };
}
