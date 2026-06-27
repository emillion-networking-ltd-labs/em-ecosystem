// Mock de @/context/ToastContext para Storybook (ECO-89). El ToastContext REAL vive en la app
// consumidora; ToastContainer importa useToast por alias. Para catalogar ToastContainer, el
// Storybook aliasa @/context → este mock que devuelve toasts de muestra.
export interface MockToast {
  id: number;
  variant: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
  duration?: number;
}

export function useToast() {
  const toasts: MockToast[] = [
    { id: 1, variant: "success", title: "Guardado", description: "Cambios aplicados." },
    { id: 2, variant: "info", title: "Sincronizando", description: "Un momento…" },
    { id: 3, variant: "error", title: "Error", description: "Inténtalo de nuevo." },
  ];
  return { toasts, removeToast: (_id: number) => {} };
}
