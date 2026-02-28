'use client';

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from 'react';

/* ===== Types ===== */

export type ToastVariant = 'error' | 'success' | 'warning' | 'info';

export type Toast = {
  id: number;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number;
};

export type AddToastInput = Omit<Toast, 'id'>;

/* ===== Reducer ===== */

type ToastAction =
  | { type: 'ADD_TOAST'; payload: Toast }
  | { type: 'REMOVE_TOAST'; payload: number };

let nextId = 0;

function toastReducer(state: Toast[], action: ToastAction): Toast[] {
  switch (action.type) {
    case 'ADD_TOAST':
      return [...state, action.payload];
    case 'REMOVE_TOAST':
      return state.filter((t) => t.id !== action.payload);
    default:
      return state;
  }
}

/* ===== Context ===== */

type ToastContextType = {
  toasts: Toast[];
  addToast: (toast: AddToastInput) => void;
  removeToast: (id: number) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

/* ===== Provider ===== */

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);

  const addToast = useCallback((input: AddToastInput) => {
    const id = nextId++;
    dispatch({ type: 'ADD_TOAST', payload: { ...input, id } });
  }, []);

  const removeToast = useCallback((id: number) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

/* ===== Hook ===== */

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
