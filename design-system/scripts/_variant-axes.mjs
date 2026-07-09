// _variant-axes — extractor COMPARTIDO de los ejes públicos de un componente (variant / size),
// robusto a los DOS idiomas que conviven durante la migración al contrato de variante (ADR-029):
//
//   · legacy  →  `export const variantClasses = { ... }` / `export const sizeClasses = { ... }`
//   · contrato →  tailwind-variants: `tv({ ..., variants: { variant: { ... }, size: { ... } }, ... })`
//
// Devuelve las CLAVES de cada eje (los nombres de variante/tamaño), no las clases. Así los gates de catálogo
// (check-variant-coverage, check-story-norm) fuerzan la cobertura de stories sobre ambos idiomas por igual —
// un componente migrado a `tv()` sigue estando cubierto, no se cuela en silencio.
//
// Uso: import { variantAxisKeys } from "./_variant-axes.mjs";  const { variant, size } = variantAxisKeys(src);

// Índice del `}` que cierra la `{` en `open` (balance de llaves).
function matchBrace(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

// Claves de 1er nivel de un cuerpo de objeto (el texto ENTRE las llaves): `name:` o `"name":` a profundidad 0.
function firstLevelKeys(body) {
  const keys = [];
  let d = 0;
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (d === 0) {
      const m = line.match(/^["']?([A-Za-z0-9_-]+)["']?\s*:/);
      if (m) keys.push(m[1]);
    }
    d += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
  }
  return keys;
}

// Idioma legacy: claves de `export const <name> = { ... }`.
function legacyMapKeys(src, name) {
  const start = src.indexOf(`export const ${name}`);
  if (start === -1) return null;
  const open = src.indexOf("{", start);
  if (open === -1) return null;
  const end = matchBrace(src, open);
  if (end === -1) return null;
  return firstLevelKeys(src.slice(open + 1, end));
}

// Idioma tv: claves del eje `<axis>` DENTRO del bloque `variants: { ... }` de un `tv({...})`.
// Sólo mira el eje a profundidad 1 del bloque variants (ignora los `variant:`/`size:` de compoundVariants,
// que son referencias a valores, no la definición del eje).
function tvAxisKeys(src, axis) {
  const vm = src.match(/\bvariants\s*:\s*{/);
  if (!vm) return null;
  const vOpen = src.indexOf("{", vm.index);
  const vEnd = matchBrace(src, vOpen);
  if (vEnd === -1) return null;

  const re = new RegExp(`^${axis}\\s*:\\s*{`);
  let depth = 0;
  for (let i = vOpen; i < vEnd; i++) {
    const c = src[i];
    if (c === "{") { depth++; continue; }
    if (c === "}") { depth--; continue; }
    // a profundidad 1 estamos entre los ejes directos de `variants`; buscamos `<axis>: {`.
    if (depth === 1 && /[A-Za-z]/.test(c) && re.test(src.slice(i))) {
      const axisOpen = src.indexOf("{", i);
      const axisEnd = matchBrace(src, axisOpen);
      if (axisEnd === -1) return null;
      return firstLevelKeys(src.slice(axisOpen + 1, axisEnd));
    }
  }
  return null;
}

// API: las claves de los ejes `variant` y `size` de un componente (arrays; vacío si el eje no existe).
export function variantAxisKeys(src) {
  return {
    variant: legacyMapKeys(src, "variantClasses") ?? tvAxisKeys(src, "variant") ?? [],
    size: legacyMapKeys(src, "sizeClasses") ?? tvAxisKeys(src, "size") ?? [],
  };
}
