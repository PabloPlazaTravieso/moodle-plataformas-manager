"use client";

import { createContext, useCallback, useContext, useState } from "react";

type Toast = { id: number; message: string; variant: "success" | "error" };

const ToastContext = createContext<{
  notify: (message: string, variant?: Toast["variant"]) => void;
} | null>(null);

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, variant: Toast["variant"] = "success") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto w-full max-w-sm rounded-lg border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur ${
              toast.variant === "success"
                ? "border-brand-cyan-700/40 bg-brand-blue-975 text-brand-cyan-50 dark:bg-brand-blue-999"
                : "border-red-400/40 bg-red-700 text-white"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
