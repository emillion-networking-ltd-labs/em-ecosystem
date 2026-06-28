"use client";

// Mock de @/context/ToastContext para Storybook (ECO-89). El ToastContext REAL vive en la app
// consumidora; ToastContainer importa useToast por alias. Para catalogar ToastContainer, el
// Storybook aliasa @/context → este mock. Los toasts se AÑADEN de forma escalonada (como en la app:
// van apareciendo a medida que ocurren eventos) para que se vea la entrada progresiva + el apilado.
import { useEffect, useState } from "react";

export interface MockToast {
  id: number;
  variant: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
  duration?: number;
}

// duration muy alta → en el catálogo no se auto-cierran tras entrar (la app real usa ~5s).
const STAY = 10_000_000;
const SAMPLES: MockToast[] = [
  { id: 1, variant: "success", title: "Saved", description: "Changes applied.", duration: STAY },
  { id: 2, variant: "info", title: "Syncing", description: "One moment…", duration: STAY },
  { id: 3, variant: "warning", title: "Storage almost full", description: "Free up space to keep syncing.", duration: STAY },
  { id: 4, variant: "error", title: "Error", description: "Please try again.", duration: STAY },
];

export function useToast() {
  const [toasts, setToasts] = useState<MockToast[]>([]);

  useEffect(() => {
    // Prepend: cada toast nuevo entra ARRIBA y empuja los anteriores hacia abajo (con `layout`).
    const timers = SAMPLES.map((t, i) =>
      setTimeout(() => {
        setToasts((prev) => (prev.some((x) => x.id === t.id) ? prev : [t, ...prev]));
      }, 350 + i * 750),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return {
    toasts,
    removeToast: (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)),
  };
}
