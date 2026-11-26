import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ServeConnect ErrorBoundary Caught]:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            minHeight: "75vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem 1.5rem",
            background: "#F8FAFC",
            fontFamily: "Inter, system-ui, sans-serif",
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              border: "1.5px solid #E2E8F0",
              borderRadius: "20px",
              padding: "2.5rem 2rem",
              maxWidth: "520px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 20px 40px -12px rgba(15, 23, 42, 0.08)",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: "#FEF2F2",
                color: "#DC2626",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1.25rem",
              }}
            >
              <AlertCircle size={30} />
            </div>

            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: "#0F172A",
                margin: "0 0 0.5rem",
                letterSpacing: "-0.02em",
              }}
            >
              Something went wrong
            </h2>

            <p
              style={{
                color: "#64748B",
                fontSize: "0.95rem",
                lineHeight: 1.6,
                margin: "0 0 1.5rem",
              }}
            >
              An unexpected error occurred while displaying this page. Your data
              and account remain completely safe.
            </p>

            {this.state.error?.message && (
              <div
                style={{
                  background: "#F1F5F9",
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  fontSize: "0.82rem",
                  color: "#475569",
                  textAlign: "left",
                  marginBottom: "1.75rem",
                  overflowX: "auto",
                  fontFamily: "monospace",
                }}
              >
                <strong>Error:</strong> {this.state.error.message}
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={this.handleReset}
                className="btn btn-primary"
                style={{
                  padding: "0.7rem 1.3rem",
                  borderRadius: "10px",
                  fontSize: "0.9rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={15} />
                <span>Reload Page</span>
              </button>

              <a
                href="/"
                className="btn btn-secondary"
                style={{
                  padding: "0.7rem 1.3rem",
                  borderRadius: "10px",
                  fontSize: "0.9rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  cursor: "pointer",
                  textDecoration: "none",
                }}
              >
                <Home size={15} />
                <span>Return to Home</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
