import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDialog({
  open,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmLabel = "Confirm",
  cancelLabel = "Keep It",
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        zIndex: 9998,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-modal"
        style={{
          width: "100%",
          maxWidth: "400px",
          background: "#FFFFFF",
          borderRadius: "16px",
          border: "1px solid #E5E7EB",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          overflow: "hidden",
          fontFamily: "'Manrope', 'Inter', system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: danger ? "#F5ECEC" : "#EAF0F5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={20} color={danger ? "#B45309" : "#1E4E8C"} />
            </div>
            <h3
              id="confirm-dialog-title"
              style={{
                margin: 0,
                fontSize: "1.1rem",
                fontWeight: 800,
                color: "#1F2937",
                fontFamily: "'Manrope', 'Inter', system-ui, sans-serif",
              }}
            >
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close dialog"
            style={{
              background: "transparent",
              border: "none",
              color: "#4B5563",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "6px",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Message */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            color: "#4B5563",
            fontSize: "0.92rem",
            lineHeight: 1.65,
            fontFamily: "'Manrope', 'Inter', system-ui, sans-serif",
          }}
        >
          {message}
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.65rem",
            padding: "1rem 1.5rem",
            borderTop: "1px solid #E5E7EB",
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: "0.6rem 1.15rem",
              borderRadius: "10px",
              border: "1px solid #D1D5DB",
              background: "transparent",
              color: "#4B5563",
              fontWeight: 600,
              fontSize: "0.88rem",
              cursor: "pointer",
              fontFamily: "'Manrope', 'Inter', system-ui, sans-serif",
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: "0.6rem 1.2rem",
              borderRadius: "10px",
              border: "none",
              background: danger ? "#B34F52" : "#1E4E8C",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "0.88rem",
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.75 : 1,
              fontFamily: "'Manrope', 'Inter', system-ui, sans-serif",
            }}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
