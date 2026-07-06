// _reconcile.mjs — helpers PUROS del reconcile de em-ui (ECO-144, design-propagation Fase 1).
// Ethos lib+shell: funciones puras (string → bool), sin IO; el shell (cli.mjs / gates) hace la IO.
// Compartidas por design-system/registry/cli.mjs y los gates (check-component-drift, check-conflict-markers)
// para que CLI y gates NUNCA discrepen sobre qué es una declaración o un marcador.

// ¿El fichero DECLARA divergencia intencional con `@em-ui-adapted` en su CABECERA? Estructurado, NO substring
// global: solo cuenta si el marcador está en el BLOQUE DE COMENTARIO INICIAL (antes de la primera línea de
// código). Así un header de licencia multi-línea encima del marcador SÍ lo protege (evita el silent-clobber si
// el marcador cae más allá de una ventana fija), pero un `@em-ui-adapted` en el cuerpo — o atrapado dentro de un
// hunk de conflicto tras el código — NO cuenta como declaración. El marcador vive en la línea 1 por convención
// (ECO-136); esto lo generaliza al prólogo de comentarios sin abrir la puerta al cuerpo.
export function isAdapted(content) {
  for (const raw of String(content).split("\n")) {
    const line = raw.trim();
    if (line === "") continue; // línea en blanco: sigue dentro de la cabecera
    const isComment =
      line.startsWith("//") || line.startsWith("/*") || line.startsWith("*") || line.startsWith("<!--");
    if (!isComment) return false; // primera línea de CÓDIGO → fin de la cabecera, sin declaración
    if (line.includes("@em-ui-adapted")) return true;
  }
  return false;
}

// Marcadores de conflicto de merge git, LINE-ANCHORED (evita falsos positivos con un "=======" decorativo a
// mitad de línea). Cubre las 4 marcas: apertura `<<<<<<< `, base de diff3 `||||||| `, separador `=======`
// (exactamente 7, línea sola) y cierre `>>>>>>> `. Las de apertura/cierre/base exigen el espacio+etiqueta que
// git escribe; el separador exige 7 `=` en línea propia.
const CONFLICT_RE = /^(?:<{7} |\|{7} |={7}\s*$|>{7} )/m;
export function hasConflictMarkers(content) {
  return CONFLICT_RE.test(String(content));
}
