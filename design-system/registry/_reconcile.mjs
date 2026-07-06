// _reconcile.mjs — helpers PUROS del reconcile de em-ui (ECO-144, design-propagation Fase 1).
// Ethos lib+shell: funciones puras (string → bool), sin IO; el shell (cli.mjs / gates) hace la IO.
// Compartidas por design-system/registry/cli.mjs y los gates (check-component-drift, check-conflict-markers)
// para que CLI y gates NUNCA discrepen sobre qué es una declaración o un marcador.

// Nº de líneas de CABECERA donde se reconoce el marcador de divergencia declarada. El marcador vive en la
// línea 1 por convención (ECO-136); la ventana da margen para un header de licencia sin abrir la puerta a que
// un `@em-ui-adapted` incrustado en el cuerpo (o dentro de un hunk de conflicto) cuente como declaración.
export const HEADER_LINES = 5;

// ¿El fichero DECLARA divergencia intencional con `@em-ui-adapted` en su CABECERA? Estructurado (solo la
// cabecera), NO substring global: un marcador más abajo (o atrapado en un conflicto) no cuenta como declaración.
export function isAdapted(content) {
  const header = String(content).split("\n").slice(0, HEADER_LINES);
  return header.some((line) => line.includes("@em-ui-adapted"));
}

// Marcadores de conflicto de merge git, LINE-ANCHORED (evita falsos positivos con un "=======" decorativo a
// mitad de línea). Cubre las 4 marcas: apertura `<<<<<<< `, base de diff3 `||||||| `, separador `=======`
// (exactamente 7, línea sola) y cierre `>>>>>>> `. Las de apertura/cierre/base exigen el espacio+etiqueta que
// git escribe; el separador exige 7 `=` en línea propia.
const CONFLICT_RE = /^(?:<{7} |\|{7} |={7}\s*$|>{7} )/m;
export function hasConflictMarkers(content) {
  return CONFLICT_RE.test(String(content));
}
