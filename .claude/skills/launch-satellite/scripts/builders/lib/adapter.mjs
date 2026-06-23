// Interfaz GENÉRICA de adapter de fuente (FB0, ECO-63 / ADR-012). Un adapter traduce UNA fuente (un backup,
// un export HTML, otro CMS) al IR común. El núcleo NO sabe de fuentes: solo conoce este contrato.
// Añadir otra fuente luego = otro adapter que produce el MISMO IR, sin tocar núcleo/IR/emitter.
//
// Un adapter es: { kind:string, detect(dir)->boolean, capture(dir)->Promise<IR> }
//   - detect: ¿este adapter reconoce el material en `dir`? (barato, sin parsear todo).
//   - capture: produce el IR lossless desde `dir`.
//
// ZERO conocimiento de ninguna fuente concreta vive aquí — solo el registro y la selección.

export function makeRegistry(adapters) {
  const list = adapters.slice();
  return {
    list,
    // Elige el primer adapter que reconoce `dir`. null si ninguno.
    detect(dir) {
      for (const a of list) {
        try { if (a.detect(dir)) return a; } catch { /* un detect que lanza = no reconoce */ }
      }
      return null;
    },
    byKind(kind) { return list.find((a) => a.kind === kind) || null; },
  };
}

// Valida que un objeto cumple el contrato de adapter (para tests + carga de adapters de terceros).
export function isAdapter(a) {
  return !!a && typeof a.kind === "string" && typeof a.detect === "function" && typeof a.capture === "function";
}
