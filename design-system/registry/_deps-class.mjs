// Clasificación de dependencias de registro (ECO-181): distingue las deps ESTRUCTURALES (la esencia de un
// compuesto — p.ej. SegmentedControl → Button) de los HELPERS transversales (Icon + los spinners), que casi
// cualquier pieza usa sin por ello ser "compuesta". Fuente única, consumida por el banner del catálogo
// (Composed of / Uses) y por la norma check-composition-class.

export const HELPER_COMPONENTS = [
  "Icon",
  "SpinnerInfinity",
  "SpinnerCircle",
  "SpinnerRing",
];

/** Parte una lista de registryDependencies en { structural, helper }. */
export function splitDeps(deps = []) {
  const structural = deps.filter((d) => !HELPER_COMPONENTS.includes(d));
  const helper = deps.filter((d) => HELPER_COMPONENTS.includes(d));
  return { structural, helper };
}
