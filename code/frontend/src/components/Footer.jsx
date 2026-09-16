import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer style={{ background: "#111827", padding: "3rem 5% 2rem", color: "rgba(255,255,255,0.7)" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "3rem", marginBottom: "2.5rem" }}>
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <div style={{ background: "var(--primary)", color: "white", width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1rem" }}>S</div>
              <span style={{ color: "white", fontWeight: 800, fontSize: "1.1rem" }}>ServeConnect</span>
            </div>
            <p style={{ lineHeight: 1.7, fontSize: "0.9rem", maxWidth: "280px" }}>
              Connecting customers with trusted, background-verified local service professionals across Punjab and Delhi.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: "white", fontWeight: 700, marginBottom: "1rem", fontSize: "0.9rem" }}>Quick Links</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {[
                { to: "/search", label: "Find Workers" },
                { to: "/worker/register", label: "Register as Worker" },
                { to: "/login", label: "Login" },
                { to: "/register", label: "Sign Up" },
              ].map(({ to, label }) => (
                <Link key={to} to={to} style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", transition: "color 0.2s", textDecoration: "none" }}
                  onMouseEnter={e => e.target.style.color = "white"}
                  onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.6)"}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 style={{ color: "white", fontWeight: 700, marginBottom: "1rem", fontSize: "0.9rem" }}>Services</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {["Electrician", "Plumber", "Carpenter", "Painter", "Cleaning", "AC Repair"].map(svc => (
                <Link key={svc} to={`/search?category=${svc}`} style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", transition: "color 0.2s", textDecoration: "none" }}
                  onMouseEnter={e => e.target.style.color = "white"}
                  onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.6)"}
                >
                  {svc}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <p style={{ fontSize: "0.85rem" }}>© 2026 ServeConnect. All rights reserved.</p>
          <p style={{ fontSize: "0.85rem" }}>Built for UCS503 — Software Engineering Project</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;