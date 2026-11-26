import { Link, useLocation } from "react-router-dom";
import { MapPin, Mail, Clock } from "lucide-react";

function Footer() {
  const location = useLocation();

  // Do not render footer on full-screen split-screen auth pages
  if (location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }

  return (
    <footer style={styles.footer}>
      <div style={styles.inner}>
        {/* Top 4-column grid */}
        <div className="footer-grid" style={styles.grid}>

          {/* Column 1 — Logo + Tagline */}
          <div>
            <div style={styles.logoRow}>
              <div style={styles.logoIcon} aria-hidden="true">S</div>
              <span style={styles.logoText}>ServeConnect</span>
            </div>
            <p style={styles.tagline}>
              Connecting customers with certified, background-verified local service professionals across Punjab and Delhi.
            </p>
            <p style={{ ...styles.tagline, marginTop: "0.5rem", fontSize: "0.78rem" }}>
              Transparent pricing · Instant booking · Guaranteed quality
            </p>
          </div>

          {/* Column 2 — Quick Links */}
          <nav aria-label="Quick links">
            <p style={styles.colHeading}>Links</p>
            <div style={styles.linkList}>
              {[
                { to: "/search",          label: "Find Professionals" },
                { to: "/worker/register", label: "Register as a Pro" },
                { to: "/login",           label: "Login" },
                { to: "/register",        label: "Sign Up" },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  style={styles.link}
                  onMouseEnter={e => e.target.style.color = "rgba(255,255,255,0.85)"}
                  onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.5)"}
                >
                  {label}
                </Link>
              ))}
            </div>
          </nav>

          {/* Column 3 — Services */}
          <nav aria-label="Services directory">
            <p style={styles.colHeading}>Services</p>
            <div style={styles.linkList}>
              {["Electrician", "Plumber", "Carpenter", "Painter", "Cleaning", "AC Repair"].map(svc => (
                <Link
                  key={svc}
                  to={`/search?category=${encodeURIComponent(svc)}`}
                  style={styles.link}
                  onMouseEnter={e => e.target.style.color = "rgba(255,255,255,0.85)"}
                  onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.5)"}
                >
                  {svc}
                </Link>
              ))}
            </div>
          </nav>

          {/* Column 4 — Contact */}
          <div>
            <p style={styles.colHeading}>Contact</p>
            <div style={styles.linkList}>
              <span style={styles.contactItem}><MapPin size={14} /> Patiala, Punjab</span>
              <span style={styles.contactItem}><Mail size={14} /> support@serveconnect.in</span>
              <span style={styles.contactItem}><Clock size={14} /> Mon–Sat, 9 AM – 7 PM</span>
              <span style={{ ...styles.contactItem, marginTop: "0.75rem", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
                UCS503 — Software Engineering Project
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={styles.divider} />
        <div className="footer-bottom" style={styles.bottomBar}>
          <p style={styles.copyright}>© 2026 ServeConnect. All rights reserved.</p>
          {/* Social icons — minimal SVG marks */}
          <div style={styles.socials}>
            {/* GitHub */}
            <a href="#" aria-label="GitHub" style={styles.socialIcon}
              onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.85)"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
            {/* LinkedIn */}
            <a href="#" aria-label="LinkedIn" style={styles.socialIcon}
              onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.85)"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            {/* Twitter/X */}
            <a href="#" aria-label="X (Twitter)" style={styles.socialIcon}
              onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.85)"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

const styles = {
  footer: {
    background: "#0F172A",
    color: "rgba(255,255,255,0.7)",
    paddingTop: "3.5rem",
    paddingBottom: "2rem",
    borderTop: "1px solid #1E293B",
  },
  inner: {
    width: "100%",
    maxWidth: "var(--container-max, 1680px)",
    paddingLeft: "var(--page-gutter, 1.5rem)",
    paddingRight: "var(--page-gutter, 1.5rem)",
    margin: "0 auto",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1.2fr",
    gap: "3rem",
    marginBottom: "2.5rem",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    marginBottom: "1rem",
  },
  logoIcon: {
    background: "#1E4E8C",
    color: "#FFFFFF",
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "0.92rem",
    flexShrink: 0,
    boxShadow: "0 2px 8px rgba(30, 78, 140, 0.3)",
    fontFamily: "'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif",
  },
  logoText: {
    color: "#FFFFFF",
    fontWeight: 800,
    fontFamily: "'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif",
    fontSize: "1.05rem",
    letterSpacing: "-0.02em",
  },
  tagline: {
    lineHeight: 1.65,
    fontSize: "0.84rem",
    maxWidth: "300px",
    color: "rgba(255,255,255,0.45)",
  },
  colHeading: {
    color: "rgba(255,255,255,0.3)",
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: "1rem",
  },
  linkList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.65rem",
  },
  link: {
    color: "rgba(255,255,255,0.5)",
    fontSize: "0.87rem",
    transition: "color 140ms ease",
    textDecoration: "none",
  },
  contactItem: {
    color: "rgba(255,255,255,0.58)",
    fontSize: "0.84rem",
    display: "flex",
    alignItems: "center",
    gap: "0.55rem",
  },
  divider: {
    borderTop: "1px solid rgba(255,255,255,0.08)",
    marginBottom: "1.5rem",
  },
  bottomBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem",
  },
  copyright: {
    fontSize: "0.82rem",
    color: "rgba(255,255,255,0.3)",
  },
  socials: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
  },
  socialIcon: {
    color: "rgba(255,255,255,0.4)",
    transition: "color 140ms ease",
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
  },
};

export default Footer;
