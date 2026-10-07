import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer style={{ background: "#111827", padding: "3rem 5% 2rem", color: "#cbd5e1" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "3rem", marginBottom: "2.5rem" }}>
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <div style={{ background: "var(--primary)", color: "white", width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1rem" }} aria-hidden="true">S</div>
              <span style={{ color: "white", fontWeight: 800, fontSize: "1.1rem" }}>ServeConnect</span>
            </div>
            <p style={{ lineHeight: 1.7, fontSize: "0.875rem", maxWidth: "280px", color: "#94a3b8" }}>
              Connecting customers with trusted, background-verified local service professionals across Punjab and Delhi.
            </p>
          </div>

          {/* Quick Links */}
          <nav aria-label="Quick links">
            <p className="footer-col-title" style={{ color: "white", fontWeight: 700, marginBottom: "1rem", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Quick Links
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {[
                { to: "/search", label: "Find Professionals" },
                { to: "/worker/register", label: "Register as a Professional" },
                { to: "/login", label: "Login" },
                { to: "/register", label: "Sign Up" },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  style={{ color: "#cbd5e1", fontSize: "0.875rem", transition: "color 0.2s", textDecoration: "none" }}
                  onMouseEnter={e => e.target.style.color = "white"}
                  onMouseLeave={e => e.target.style.color = "#cbd5e1"}
                >
                  {label}
                </Link>
              ))}
            </div>
          </nav>

          {/* Services */}
          <nav aria-label="Services directory">
            <p className="footer-col-title" style={{ color: "white", fontWeight: 700, marginBottom: "1rem", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Services
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {["Electrician", "Plumber", "Carpenter", "Painter", "Cleaning", "AC Repair"].map(svc => (
                <Link
                  key={svc}
                  to={`/search?category=${encodeURIComponent(svc)}`}
                  style={{ color: "#cbd5e1", fontSize: "0.875rem", transition: "color 0.2s", textDecoration: "none" }}
                  onMouseEnter={e => e.target.style.color = "white"}
                  onMouseLeave={e => e.target.style.color = "#cbd5e1"}
                >
                  {svc}
                </Link>
              ))}
            </div>
          </nav>
        </div>

        <div className="footer-bottom" style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>© 2026 ServeConnect. All rights reserved.</p>
          <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Built for UCS503 — Software Engineering Project</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;