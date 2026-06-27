// Mock de @/context/ThemeContext para Storybook (ECO-89). El ThemeContext REAL vive en la app
// consumidora (dashboard), no en la fuente del design-system; useTheme.ts lo importa por alias.
// Para catalogar los componentes app-coupled (ThemeToggle, TurnstileWidget) en el catálogo, el
// Storybook aliasa @/context → este mock con un valor por defecto NO-nulo (useTheme no lanza).
import { createContext } from "react";

export interface ThemeContextValue {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
});
