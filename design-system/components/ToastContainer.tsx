"use client";

import { AnimatePresence } from "motion/react";
import { useToast } from "@/context/ToastContext";
import Toast from "@/components/ui/Toast";

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="pointer-events-none fixed inset-x-0 top-6 z-50 flex flex-col items-center gap-2 px-[50px]">
      <AnimatePresence>
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
      </AnimatePresence>
    </div>
  );
}
