import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, X, AlertTriangle } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = "success", duration = 4000) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: "1.5rem",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            gap: "0.65rem",
            maxWidth: "380px",
            width: "calc(100vw - 2rem)",
          }}
        >
          {toasts.map((t) => {
            const isError = t.type === "error";
            const isWarning = t.type === "warning";
            const bg = isError ? "#FEF2F2" : isWarning ? "#FFFBEB" : "#ECFDF5";
            const border = isError ? "#FECACA" : isWarning ? "#FDE68A" : "#A7F3D0";
            const color = isError ? "#991B1B" : isWarning ? "#92400E" : "#065F46";
            const Icon = isError ? AlertCircle : isWarning ? AlertTriangle : CheckCircle2;

            return (
              <div
                key={t.id}
                role="status"
                className="animate-slide-up"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  padding: "0.9rem 1rem",
                  background: bg,
                  border: `1.5px solid ${border}`,
                  borderRadius: "12px",
                  boxShadow: "0 12px 28px -4px rgba(15, 23, 42, 0.14)",
                  color,
                }}
              >
                <Icon size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                <span style={{ flex: 1, fontSize: "0.88rem", fontWeight: 600, lineHeight: 1.45 }}>
                  {t.message}
                </span>
                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  aria-label="Dismiss notification"
                  style={{
                    background: "transparent",
                    border: "none",
                    color,
                    opacity: 0.7,
                    cursor: "pointer",
                    padding: "2px",
                    display: "flex",
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return { showToast: () => {} };
  }
  return ctx;
}
