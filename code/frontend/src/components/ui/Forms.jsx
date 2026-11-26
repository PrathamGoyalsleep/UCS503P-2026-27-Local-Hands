import React from "react";
import "./ui.css";

export function Button({
  children,
  variant = "primary", // primary | secondary | outline | ghost | danger
  size = "md", // sm | md | lg
  loading = false,
  disabled = false,
  icon: Icon,
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`ui-btn ui-btn-${variant} ui-btn-${size} ${className}`}
      {...props}
    >
      {loading ? (
        <span
          style={{
            width: 14,
            height: 14,
            border: "2px solid currentColor",
            borderRightColor: "transparent",
            borderRadius: "50%",
            display: "inline-block",
            animation: "spin 0.7s linear infinite",
          }}
        />
      ) : Icon ? (
        <Icon size={size === "sm" ? 13 : size === "lg" ? 18 : 15} />
      ) : null}
      <span>{children}</span>
    </button>
  );
}

export function Input({
  label,
  error,
  hint,
  icon: Icon,
  id,
  className = "",
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  return (
    <div className={`ui-form-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="ui-label">
          {label}
        </label>
      )}
      <div className="ui-input-wrapper">
        {Icon && (
          <span className="ui-input-icon-left">
            <Icon size={16} />
          </span>
        )}
        <input
          id={inputId}
          className={`ui-input ${Icon ? "with-left-icon" : ""} ${error ? "has-error" : ""}`}
          {...props}
        />
      </div>
      {error && <span className="ui-error">{error}</span>}
      {hint && !error && <span className="ui-hint">{hint}</span>}
    </div>
  );
}

export function Select({
  label,
  error,
  hint,
  id,
  children,
  className = "",
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  return (
    <div className={`ui-form-group ${className}`}>
      {label && (
        <label htmlFor={selectId} className="ui-label">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`ui-select ${error ? "has-error" : ""}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="ui-error">{error}</span>}
      {hint && !error && <span className="ui-hint">{hint}</span>}
    </div>
  );
}

export function Textarea({
  label,
  error,
  hint,
  id,
  className = "",
  rows = 3,
  ...props
}) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  return (
    <div className={`ui-form-group ${className}`}>
      {label && (
        <label htmlFor={textareaId} className="ui-label">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={`ui-textarea ${error ? "has-error" : ""}`}
        {...props}
      />
      {error && <span className="ui-error">{error}</span>}
      {hint && !error && <span className="ui-hint">{hint}</span>}
    </div>
  );
}
