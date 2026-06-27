import type { TestRunnerConfig } from "@storybook/test-runner";

// VRT del catálogo (ADR-020): test-runner de Storybook (Jest + Playwright, MIT), NO Chromatic.
// El hook `postVisit` corre por cada story tras renderizar. En esta tanda (ECO-85) deja
// CABLEADO el snapshot visual; comprometer el set de baselines es follow-up (requiere
// browsers en CI — ver spec ECO-85 §Out of scope). Hoy: prueba que cada story renderiza
// sin error y captura el screenshot (la comparación contra baseline se enchufa después).
const config: TestRunnerConfig = {
  async postVisit(page, context) {
    // Espera al root de Storybook (si no renderiza, Playwright falla la story).
    await page.waitForSelector("#storybook-root", { state: "attached" });
    // Captura el screenshot del story (buffer): cierra el lazo de "buildea Y renderiza".
    // La comparación contra baseline (toMatchImageSnapshot) se añade con el set de baselines.
    await page.screenshot({ fullPage: false });
  },
};

export default config;
