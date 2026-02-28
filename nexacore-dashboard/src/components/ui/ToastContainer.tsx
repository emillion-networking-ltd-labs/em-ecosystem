'use client';

import { useToast } from '@/context/ToastContext';
import Toast from '@/components/ui/Toast';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed left-1/2 top-6 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          variant={toast.variant}
          title={toast.title}
          description={toast.description}
          duration={toast.duration}
          onClose={removeToast}
        />
      ))}
    </div>
  );
}
