import { useNavigate } from "react-router-dom";
import { useState } from "react";

const services = [
  {
    name: "Electrician",
    desc: "Wiring, repairs & installations",
    color: "#F59E0B",
    bg: "#FFFBEB",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    name: "Plumber",
    desc: "Pipes, leaks & fixtures",
    color: "#3B82F6",
    bg: "#EFF6FF",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    name: "Carpenter",
    desc: "Furniture, doors & woodwork",
    color: "#8B5CF6",
    bg: "#F5F3FF",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 17.5L3 6V3h3l11.5 11.5" /><path d="M13 19l6-6" /><path d="M16 16l4 4" /><path d="M19 21l2-2" />
      </svg>
    ),
  },
  {
    name: "Painter",
    desc: "Interior & exterior painting",
    color: "#EC4899",
    bg: "#FDF2F8",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 13.5V20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6.5" /><path d="M12 2v13" /><path d="M8 6l4-4 4 4" />
      </svg>
    ),
  },
  {
    name: "Cleaning",
    desc: "Deep clean & sanitization",
    color: "#10B981",
    bg: "#ECFDF5",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      </svg>
    ),
  },
  {
    name: "AC Repair",
    desc: "Service, gas & maintenance",
    color: "#06B6D4",
    bg: "#ECFEFF",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 7H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /><path d="M12 7V3" /><path d="M8 7V5" /><path d="M16 7V5" />
      </svg>
    ),
  },
];

const stats = [
  { value: "10,000+", label: "Verified Professionals" },
  { value: "50,000+", label: "Bookings Completed" },
  { value: "4.8 / 5", label: "Average Rating" },
  { value: "6 Cities", label: "Across Punjab & Delhi" },
];

function Home() {
  const navigate = useNavigate();
  const [searchCat, setSearchCat] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?category=${encodeURIComponent(searchCat)}`);
  };

  return (
    <div>
      {/* ── Hero ── */}
      <section className="hero">
        <span className="hero-badge">Trusted Home Services Platform</span>
        <h1>
          Expert professionals,<br />
          <span>at your doorstep.</span>
        </h1>
        <p>
          Book background-verified electricians, plumbers, carpenters and more.
          Instant booking. Transparent pricing. Quality guaranteed.
        </p>
        <form className="hero-search-container" onSubmit={handleSearch}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "1rem", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            className="hero-search-input"
            placeholder="Search for a service — plumber, electrician..."
            value={searchCat}
            onChange={(e) => setSearchCat(e.target.value)}
          />
          <button type="submit" className="hero-search-btn">Search</button>
        </form>
      </section>

      {/* ── Stats Bar ── */}
      <section style={{ background: "white", borderBottom: "1px solid var(--border)", padding: "2rem 5%" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", textAlign: "center" }}>
          {stats.map((s, i) => (
            <div key={s.label} style={{ borderRight: i < stats.length - 1 ? "1px solid var(--border)" : "none", padding: "0.5rem 1rem" }}>
              <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--primary)" }}>{s.value}</div>
              <div style={{ fontSize: "0.83rem", color: "var(--text-muted)", marginTop: "0.25rem", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Services Grid ── */}
      <section className="section">
        <div className="section-header">
          <span className="section-label">OUR SERVICES</span>
          <h2>What are you looking for?</h2>
          <p>Choose from our wide range of professional home services.</p>
        </div>

        <div className="category-grid">
          {services.map((svc) => (
            <div
              key={svc.name}
              className="category-card"
              onClick={() => navigate(`/search?category=${encodeURIComponent(svc.name)}`)}
            >
              <div className="category-icon" style={{ color: svc.color, background: svc.bg }}>
                {svc.icon}
              </div>
              <h3>{svc.name}</h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>{svc.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ background: "white", padding: "5rem 5%", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div className="section-header">
            <span className="section-label">HOW IT WORKS</span>
            <h2>Book a service in 3 simple steps</h2>
            <p>Fast, transparent and reliable — every time.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem", textAlign: "center" }}>
            {[
              { step: "01", title: "Choose a Service", desc: "Select from our range of professional home services and pick your location.", color: "#3B82F6" },
              { step: "02", title: "Pick Your Expert", desc: "Browse verified professionals, compare ratings and hourly pricing.", color: "#8B5CF6" },
              { step: "03", title: "Confirm & Relax", desc: "Book a time slot instantly. Our expert arrives at your door on time.", color: "#10B981" },
            ].map((item) => (
              <div key={item.step} style={{ padding: "2rem", borderRadius: "16px", border: "1px solid var(--border)", position: "relative" }}>
                <div style={{ fontSize: "3rem", fontWeight: 900, color: item.color, opacity: 0.12, position: "absolute", top: "1rem", right: "1.5rem", lineHeight: 1 }}>{item.step}</div>
                <div style={{ width: "48px", height: "48px", background: item.color, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "1.1rem", marginBottom: "1rem" }}>{item.step}</div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem", color: "#1a1a2e" }}>{item.title}</h3>
                <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)", padding: "5rem 5%", textAlign: "center" }}>
        <h2 style={{ fontSize: "2.25rem", fontWeight: 800, color: "white", marginBottom: "1rem" }}>Are you a service professional?</h2>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "1.1rem", marginBottom: "2rem" }}>Join thousands of experts earning more with ServeConnect.</p>
        <a href="/worker/register" style={{ background: "white", color: "var(--primary)", padding: "0.9rem 2.5rem", borderRadius: "9999px", fontWeight: 700, fontSize: "1rem", display: "inline-block" }}>
          Register as a Professional
        </a>
      </section>
    </div>
  );
}

export default Home;
