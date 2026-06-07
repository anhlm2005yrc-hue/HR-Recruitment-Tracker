import React, { createContext, useContext, useState, useCallback } from "react";
import { Slicon } from "./Slicon";
import { AnimatePresence, motion } from "motion/react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
  id: string;
  text: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (text: string, type?: ToastType) => void;
  toasts: ToastMessage[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
    
    // Auto dismissing in 3000ms
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, toasts }}>
      {children}
      {/* Toast container floating over top-right */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-lg border bg-white/95 backdrop-blur-md"
              style={{
                borderColor:
                  toast.type === "success"
                    ? "#D8F3DC"
                    : toast.type === "error"
                    ? "#FECACA"
                    : "#E5E7EB",
              }}
            >
              <div
                className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full"
                style={{
                  backgroundColor:
                    toast.type === "success"
                      ? "#D8F3DC"
                      : toast.type === "error"
                      ? "#FEE2E2"
                      : "#F3F4F6",
                  color:
                    toast.type === "success"
                      ? "#2D6A4F"
                      : toast.type === "error"
                      ? "#DC2626"
                      : "#4B5563",
                }}
              >
                <Slicon
                  name={
                    toast.type === "success"
                      ? "check-circle"
                      : toast.type === "error"
                      ? "warning"
                      : "mail"
                  }
                  size={18}
                />
              </div>
              <p className="text-sm font-medium text-gray-800 leading-relaxed">
                {toast.text}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
