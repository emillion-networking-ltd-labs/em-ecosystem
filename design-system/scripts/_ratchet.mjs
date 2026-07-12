// _ratchet.mjs — ratchet compartido para gates de dimensión en modo "ratchet" (estrategia design-enforcement).
//
// Un gate en modo ratchet NO es zero-tolerance: registra en un baseline el nº de violaciones existentes y solo
// FALLA si el nº SUBE (código nuevo sucio), no por la deuda ya presente. Así una dimensión se puede empezar a
// gatear sobre un corpus sucio sin big-bang; el baseline solo DECRECE (al arreglar, se re-baja con --update), y
// gana el zero-tolerance cuando llega a 0 (entonces la dimensión pasa a mode "enforce" en el manifiesto).
// Modelo espejo de ESLint bulk-suppressions: un JSON versionado por-gate que solo puede bajar.

/** ¿falla el ratchet? current > baseline permitido → sí (violaciones nuevas). Puro, exportado para test. */
export function ratchetCheck(baseline, gateId, current) {
  const allowed = baseline?.[gateId] ?? 0;
  return {
    fail: current > allowed,
    allowed,
    current,
    exceeded: Math.max(0, current - allowed),
  };
}

/** El baseline SOLO decrece: el nuevo valor permitido es min(actual, previo). Puro, exportado para test. */
export function nextBaseline(baseline, gateId, current) {
  // Sin baseline previo → INICIALIZA a `current` (captura la deuda actual). Con baseline previo → solo DECRECE.
  const prev = baseline?.[gateId];
  return {
    ...baseline,
    [gateId]: prev === undefined ? current : Math.min(current, prev),
  };
}
