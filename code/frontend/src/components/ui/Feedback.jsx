import React, { useEffect } from "react";
import { X, Star } from "../icons";
import "./ui.css";

/* ── Card ── */
export function Card({ children, hover = false, className = "", style = {}, ...props }) {
  return (
    <div className={`ui-card ${hover ? "ui-card-hover" : ""} ${className}`} style={style} {...props}>
      {children}
    </div>
  );
}

/* ── StatCard ── */
export function StatCard({
  icon: Icon,
  iconBg = "#EFF6FF",
  iconColor = "#2563EB",
  value,
  label,
  className = "",
  style = {},
}) {
  return (
    <div className={`ui-stat-card ${className}`} style={style}>
      {Icon && (
        <div className="ui-stat-icon-wrapper" style={{ background: iconBg, color: iconColor }}>
          <Icon size={22} />
        </div>
      )}
      <div>
        <div className="ui-stat-value">{value}</div>
        <div className="ui-stat-label">{label}</div>
      </div>
    </div>
  );
}

/* ── StatusBadge ── */
export function StatusBadge({ status = "pending", label, className = "", style = {} }) {
  const norm = String(status || "").toLowerCase();
  const displayLabel = label || norm.charAt(0).toUpperCase() + norm.slice(1);
  return (
    <span className={`ui-status-badge status-${norm} ${className}`} style={style}>
      <span className="ui-badge-dot" />
      <span>{displayLabel}</span>
    </span>
  );
}

/* ── Avatar ── */
export function Avatar({
  src,
  name = "User",
  size = 40,
  verified = false,
  className = "",
  style = {},
}) {
  const initial = (name || "U").charAt(0).toUpperCase();
  return (
    <div
      className={`ui-avatar ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.42, ...style }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        initial
      )}
    </div>
  );
}

/* ── RatingStars ── */
export function RatingStars({ rating = 0, count, showScore = true, size = 14 }) {
  const num = Number(rating) || 0;
  return (
    <div className="ui-rating-stars">
      <Star size={size} fill="#F59E0B" color="#F59E0B" />
      {showScore && <span>{num > 0 ? num.toFixed(1) : "New"}</span>}
      {count !== undefined && count !== null && (
        <span style={{ color: "var(--color-text-secondary)", fontWeight: 500 }}>
          ({count})
        </span>
      )}
    </div>
  );
}

/* ── EmptyState ── */
export function EmptyState({
  icon: Icon,
  title = "No items found",
  description,
  action,
  className = "",
}) {
  return (
    <div className={`ui-empty-state ${className}`}>
      {Icon && (
        <div className="ui-empty-icon-box">
          <Icon size={34} />
        </div>
      )}
      <h3 className="ui-empty-title">{title}</h3>
      {description && <p className="ui-empty-desc">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}

/* ── Skeleton ── */
export function Skeleton({ width = "100%", height = 20, radius = "8px", className = "", style = {} }) {
  return (
    <div
      className={`ui-skeleton ${className}`}
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

/* ── Modal Shell ── */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 580,
  className = "",
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="ui-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`ui-modal-container animate-modal ${className}`}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="ui-modal-header">
            <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text-primary)" }}>
              {title}
            </h3>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-text-secondary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: 4,
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div className="ui-modal-body">{children}</div>
        {footer && <div className="ui-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

/* ── SectionHeader ── */
export function SectionHeader({
  kicker,
  title,
  subtitle,
  action,
  className = "",
  style = {},
}) {
  return (
    <div
      className={`ui-section-header ${className}`}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        flexWrap: "wrap",
        gap: "1rem",
        ...style,
      }}
    >
      <div>
        {kicker && <div className="ui-section-kicker">{kicker}</div>}
        <h2 className="ui-section-title">{title}</h2>
        {subtitle && <p className="ui-section-subtitle">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
