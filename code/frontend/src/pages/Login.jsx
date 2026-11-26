import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../services/authService";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
  BadgeCheck,
} from "../components/icons";
import "./Login.css";

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // If already authenticated, redirect to appropriate destination
  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = location.state?.from?.pathname;
      if (redirectPath && redirectPath !== "/login") {
        navigate(redirectPath, { replace: true });
      } else if (user?.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (user?.role === "worker") {
        navigate("/bookings", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location]);

  // Restore remembered email on initial load
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("serveconnect_remembered_email");
      if (savedEmail) {
        setFormData((prev) => ({ ...prev, email: savedEmail }));
        setRememberMe(true);
      }
    } catch {
      // localStorage may be unavailable in private browsing
    }
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const email = formData.email.trim();
    const password = formData.password;

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const data = await loginUser({ email, password });

      if (!data.token) {
        throw new Error("Authentication succeeded but no session token was received.");
      }

      // Persist authenticated state (isolated to tab in sessionStorage, plus localStorage if rememberMe)
      login(
        data.token,
        {
          _id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
          profileImage: data.profileImage || "",
        },
        rememberMe
      );

      // Handle "Remember Me"
      try {
        if (rememberMe) {
          localStorage.setItem("serveconnect_remembered_email", email);
        } else {
          localStorage.removeItem("serveconnect_remembered_email");
        }
      } catch {
        // Ignore storage errors
      }

      // Automatic Role-Based Routing
      const userRole = (data.role || "").toLowerCase();
      const redirectPath = location.state?.from?.pathname;

      if (redirectPath && redirectPath !== "/login") {
        navigate(redirectPath, { replace: true });
      } else if (userRole === "admin") {
        // Verified Admin -> Admin Dashboard Console
        navigate("/admin", { replace: true });
      } else if (userRole === "worker") {
        // Verified Service Partner -> Worker Job Management Dashboard
        navigate("/bookings", { replace: true });
      } else {
        // Customer -> Customer Home / Marketplace
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Invalid email or password. Please verify your credentials and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-split-page">
      {/* ─────────────────────────────────────────────────────────────
          LEFT SECTION (58% Desktop Width — Full Height Photography)
      ───────────────────────────────────────────────────────────── */}
      <section className="login-left-section" aria-label="ServeConnect Brand Experience">
        <img
          src="/images/login-hero.jpg"
          alt="Professional home-service technician working in modern luxury residence"
          className="login-hero-img"
        />

        <div className="login-hero-overlay">
          {/* Brand Header */}
          <div className="login-left-brand">
            <Link to="/" className="login-brand-link" title="Return to ServeConnect Home">
              <span className="login-brand-icon">S</span>
              <span className="login-brand-title">ServeConnect</span>
            </Link>
            <span className="login-brand-badge">Trusted Home Services</span>
          </div>

          {/* Hero Content */}
          <div className="login-hero-content">
            <h1 className="login-hero-headline">
              Your Home Deserves the Best.
            </h1>
            <p className="login-hero-description">
              Find trusted professionals for every home service. Book verified experts and enjoy reliable service at your doorstep.
            </p>

            {/* Three Trust Indicators */}
            <div className="login-trust-list">
              <div className="login-trust-item">
                <div className="login-trust-icon-wrap">
                  <ShieldCheck size={20} color="#60A5FA" />
                </div>
                <div>
                  <h3 className="login-trust-title">Verified Professionals</h3>
                  <p className="login-trust-desc">Government ID & trade certification vetting</p>
                </div>
              </div>

              <div className="login-trust-item">
                <div className="login-trust-icon-wrap">
                  <CheckCircle2 size={20} color="#34D399" />
                </div>
                <div>
                  <h3 className="login-trust-title">Trusted Service</h3>
                  <p className="login-trust-desc">Transparent pricing & 100% satisfaction commitment</p>
                </div>
              </div>

              <div className="login-trust-item">
                <div className="login-trust-icon-wrap">
                  <BadgeCheck size={20} color="#93C5FD" />
                </div>
                <div>
                  <h3 className="login-trust-title">Secure Bookings</h3>
                  <p className="login-trust-desc">In-app Stripe payments & live encrypted chat</p>
                </div>
              </div>
            </div>
          </div>

          {/* Left Section Footer */}
          <div className="login-hero-footer">
            <p className="login-footer-tagline">
              Making home services simpler, safer and smarter.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT SECTION (42% Desktop Width — Clean White Login Area)
      ───────────────────────────────────────────────────────────── */}
      <section className="login-right-section" aria-label="Account Login">
        <div className="login-form-inner">
          
          {/* Header Area */}
          <div className="login-header-area">
            <Link to="/" className="login-brand-link" style={{ marginBottom: "1.25rem", display: "inline-flex" }}>
              <span className="login-brand-icon" style={{ width: "38px", height: "38px", fontSize: "1.15rem" }}>S</span>
              <span className="login-brand-title" style={{ color: "#0F172A", fontSize: "1.25rem" }}>ServeConnect</span>
            </Link>

            <h2 className="login-welcome-title">Welcome Back</h2>
            <p className="login-welcome-desc">
              Sign in to access your ServeConnect account.
            </p>
          </div>

          {/* Error Alert Banner */}
          {error && (
            <div className="login-error-banner" role="alert">
              <AlertCircle size={18} color="#DC2626" style={{ marginTop: "2px", flexShrink: 0 }} />
              <div>
                <strong>Authentication Notice: </strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} noValidate className="login-form">
            {/* Email Field */}
            <div className="login-input-group">
              <label htmlFor="login-email" className="login-input-label">
                Email Address
              </label>
              <div className="login-input-box">
                <Mail size={18} className="login-input-icon" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  className="login-input-field"
                  aria-required="true"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="login-input-group">
              <div className="login-label-row">
                <label htmlFor="login-password" className="login-input-label">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="login-forgot-btn"
                >
                  Forgot password?
                </button>
              </div>
              <div className="login-input-box">
                <Lock size={18} className="login-input-icon" />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  className="login-input-field"
                  style={{ paddingRight: "3rem" }}
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={0}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="login-checkbox-row">
              <label className="login-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="login-checkbox-input"
                />
                <span>Remember my email</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="login-submit-button"
            >
              {loading ? (
                <>
                  <Loader2 size={18} color="#FFFFFF" className="animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} color="#FFFFFF" />
                </>
              )}
            </button>
          </form>

          {/* Security & Role Auto-Detection Badge */}
          <div className="login-security-indicator">
            <ShieldCheck size={16} color="#059669" />
            <span>Automatic role routing &bull; 256-bit SSL secured</span>
          </div>

          {/* Links & Professional Registration */}
          <div className="login-links-footer">
            <p className="login-register-prompt">
              Don't have an account?
              <Link to="/register" className="login-link-highlight">
                Create an account
              </Link>
            </p>

            <Link to="/worker/register" className="login-worker-card">
              <span className="login-worker-text">Are you a service professional?</span>
              <span className="login-worker-action">
                Register as a Professional &rarr;
              </span>
            </Link>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          FORGOT PASSWORD MODAL (Preserved Behavior)
      ───────────────────────────────────────────────────────────── */}
      {showForgotModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 9999,
          }}
          onClick={() => setShowForgotModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              width: "100%",
              maxWidth: "460px",
              background: "#FFFFFF",
              borderRadius: "16px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              border: "1px solid #E2E8F0",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
            className="animate-modal"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid #F1F5F9",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "8px",
                    background: "#EFF6FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Lock size={17} color="#2563EB" />
                </div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0F172A" }}>
                  Password Recovery
                </h3>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.25rem",
                  color: "#64748B",
                  borderRadius: "6px",
                }}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "1.5rem" }}>
              <p style={{ color: "#334155", fontSize: "0.92rem", lineHeight: 1.6, margin: "0 0 1rem" }}>
                For security reasons in this deployment, administrative and verified account resets are managed directly through system administrators.
              </p>
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "10px",
                  padding: "1rem",
                }}
              >
                <div style={{ fontWeight: 700, color: "#1E293B", fontSize: "0.85rem", marginBottom: "0.3rem" }}>
                  Contact Platform Support:
                </div>
                <div style={{ color: "#2563EB", fontWeight: 600, fontSize: "0.88rem" }}>
                  support@serveconnect.com
                </div>
                <div style={{ color: "#64748B", fontSize: "0.8rem", marginTop: "0.5rem" }}>
                  Demo admin credentials: <strong>admin@serveconnect.com</strong> / <strong>admin123</strong>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "1rem 1.5rem 1.25rem",
                background: "#F8FAFC",
                borderTop: "1px solid #F1F5F9",
              }}
            >
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="login-submit-button"
                style={{ height: "42px", fontSize: "0.92rem" }}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
