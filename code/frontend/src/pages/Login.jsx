import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";

const DEMO_ACCOUNTS = [
  {
    label: "Login as Admin",
    desc: "Full admin access",
    email: "admin@serveconnect.com",
    password: "Admin@1234",
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    label: "Login as Customer",
    desc: "Book services",
    email: "vijayakiranyarra@gmail.com",
    password: "123456",
    color: "#059669",
    bg: "#ECFDF5",
    border: "#6EE7B7",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function doLogin(email, password) {
    setError("");
    setLoading(true);
    try {
      const data = await loginUser({ email, password });
      if (!data.token) throw new Error("Login succeeded but no JWT was returned.");
      login(data.token, { _id: data._id, name: data.name, email: data.email, role: data.role });
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!formData.email.trim()) { setError("Please enter your email."); return; }
    if (!formData.email.includes("@")) { setError("Please enter a valid email address."); return; }
    if (!formData.password) { setError("Please enter your password."); return; }
    doLogin(formData.email, formData.password);
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: "460px" }}>
        <div className="auth-header">
          <div className="auth-icon">S</div>
          <h1>Welcome back</h1>
          <p>Login to your ServeConnect account.</p>
        </div>

        {/* ── Quick Demo Login ── */}
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "0.75rem", textAlign: "center" }}>
            Quick Demo Access
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.label}
                onClick={() => doLogin(acc.email, acc.password)}
                disabled={loading}
                style={{
                  padding: "0.75rem 1rem", background: acc.bg, border: `1.5px solid ${acc.border}`,
                  borderRadius: "10px", cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                  display: "flex", flexDirection: "column", gap: "0.3rem", opacity: loading ? 0.6 : 1,
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "none"}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: acc.color, fontWeight: 700, fontSize: "0.85rem" }}>
                  {acc.icon} {acc.label}
                </span>
                <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{acc.email}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          <span style={{ fontSize: "0.8rem", color: "#9ca3af", whiteSpace: "nowrap" }}>or login manually</span>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        </div>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Enter your password" />
          </div>
          <button type="submit" className="btn btn-primary full-width" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Create one</Link></p>
        </div>
      </div>
    </div>
  );
}

export default Login;
