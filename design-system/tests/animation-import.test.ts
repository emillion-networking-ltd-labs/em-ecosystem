import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
// @ts-expect-error — script .mjs sin tipos
import { animationImportHits } from "../scripts/check-animation-import.mjs";

// ECO-195 — gate de dimensión animación: import por `motion/react`, no el alias legacy `framer-motion`.
const DS = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("check-animation-import (ECO-195)", () => {
  it("caza el import del alias legacy (comillas dobles y simples)", () => {
    expect(
      animationImportHits(`import { motion } from "framer-motion";`),
    ).toHaveLength(1);
    expect(
      animationImportHits(`import { AnimatePresence } from 'framer-motion';`),
    ).toHaveLength(1);
  });

  it("NO caza una mención en string/array ni comentario (precisión: exige `from`)", () => {
    expect(animationImportHits(`files: ["framer-motion", "globals.css"],`)).toHaveLength(0);
    expect(animationImportHits(`dep: "framer-motion (~30KB gzipped)",`)).toHaveLength(0);
    expect(animationImportHits(`// migrado desde framer-motion`)).toHaveLength(0);
  });

  it("NO caza el import canónico `motion/react`", () => {
    expect(
      animationImportHits(`import { motion, AnimatePresence } from "motion/react";`),
    ).toHaveLength(0);
  });

  it("respeta `animation-ok` (línea o anterior)", () => {
    expect(
      animationImportHits(`import x from "framer-motion"; // animation-ok: legacy`),
    ).toHaveLength(0);
  });

  it("la flota está LIMPIA de `framer-motion` (guard permanente, enforce)", () => {
    expect(() =>
      execFileSync("node", [join(DS, "scripts", "check-animation-import.mjs")], {
        cwd: DS,
      }),
    ).not.toThrow();
  });
});
