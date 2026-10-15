import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLocationState } from "../context/LocationContext";
import { useState, useRef, useEffect } from "react";

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { location, setLocation, detectLocation } = useLocationState();
  const navigate = useNavigate();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const popularCities = ["Patiala", "Delhi", "Chandigarh", "Ludhiana"];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [navigate]);

  function handleLogout() {
    logout();
    setIsMenuOpen(false);
    navigate("/login");
  }

  const handleSelectCity = (city) => {
    setLocation(city);
    setIsDropdownOpen(false);
  };

  const handleDetect = () => {
    detectLocation();
    setIsDropdownOpen(false);
  };

  return (
    <>
      <header className="navbar" style={{ position: "relative" }}>
        {/* Left: Logo + Location */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <Link to="/" className="nav-logo" onClick={() => setIsMenuOpen(false)}>
            <span className="nav-logo-icon">S</span>
            <span className="nav-logo-text">ServeConnect</span>
          </Link>

          {/* Location Dropdown */}
          <div ref={dropdownRef} style={{ position: "relative" }} className="nav-location-wrapper">
            <button
              type="button"
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-main)", fontSize: "0.875rem", background: "var(--bg-light)", padding: "0.45rem 0.75rem", borderRadius: "8px", cursor: "pointer", border: "none" }}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="nav-location-btn"
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
              aria-label={`Select city. Currently set to ${location}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
              <span style={{ fontWeight: 600, maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{location}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </button>

            {isDropdownOpen && (
              <div role="listbox" aria-label="Available cities" style={{ position: "absolute", top: "110%", left: "0", background: "white", boxShadow: "0 8px 30px rgba(0,0,0,0.12)", borderRadius: "12px", width: "220px", zIndex: 1000, padding: "0.5rem 0", border: "1px solid var(--border)" }}>
                <div role="option" aria-selected={false} tabIndex={0} style={{ padding: "0.75rem 1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--bg-light)" }} onClick={handleDetect}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2v4" /><path d="M12 18v4" /><path d="M2 12h4" /><path d="M18 12h4" /><circle cx="12" cy="12" r="4" /></svg>
                  <span style={{ color: "var(--primary)", fontWeight: 600, fontSize: "0.875rem" }}>Detect Current Location</span>
                </div>
                <div style={{ padding: "0.4rem 1rem", fontSize: "0.72rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.8px", marginTop: "0.25rem" }}>Popular Cities</div>
                {popularCities.map(city => (
                  <div key={city} role="option" aria-selected={location === city} tabIndex={0} style={{ padding: "0.55rem 1rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}
                    onClick={() => handleSelectCity(city)}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-light)"}
                    onMouseLeave={e => e.currentTarget.style.background = "white"}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /></svg>
                    {city}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center Nav Links (Desktop only) */}
        <nav className="nav-links nav-desktop" aria-label="Main navigation">
          <Link to="/">Home</Link>
          <Link to="/search">Find Professionals</Link>
          {isAuthenticated && <Link to="/bookings">My Bookings</Link>}
          {isAuthenticated && user?.role === "admin" && <Link to="/admin">Admin Panel</Link>}
        </nav>

        {/* Right: Auth (Desktop only) */}
        <div className="nav-desktop" style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {!isAuthenticated ? (
            <>
              <Link to="/login" style={{ fontWeight: 500, color: "var(--text-muted)", fontSize: "0.875rem" }}>Login</Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: "0.55rem 1.1rem", fontSize: "0.875rem" }}>Get Started</Link>
            </>
          ) : (
            <>
              <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>Hi, {user?.name?.split(" ")[0] || "User"}</span>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: "0.55rem 1rem", fontSize: "0.875rem" }}>Logout</button>
            </>
          )}
        </div>

        {/* Hamburger (Mobile only) */}
        <button className="nav-hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle navigation menu" aria-expanded={isMenuOpen}>
          {isMenuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
      </header>

      {/* Mobile Menu Drawer */}
      {isMenuOpen && (
        <nav className="nav-mobile-menu" aria-label="Mobile navigation">
          <Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
          <Link to="/search" onClick={() => setIsMenuOpen(false)}>Find Professionals</Link>
          {isAuthenticated && <Link to="/bookings" onClick={() => setIsMenuOpen(false)}>My Bookings</Link>}
          {isAuthenticated && user?.role === "admin" && <Link to="/admin" onClick={() => setIsMenuOpen(false)}>Admin Panel</Link>}
          <div style={{ borderTop: "1px solid var(--border)", marginTop: "0.5rem", paddingTop: "0.75rem" }}>
            {!isAuthenticated ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <Link to="/login" className="btn btn-secondary" onClick={() => setIsMenuOpen(false)}>Login</Link>
                <Link to="/register" className="btn btn-primary" onClick={() => setIsMenuOpen(false)}>Get Started</Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <span style={{ fontWeight: 600, color: "var(--text-main)" }}>Hi, {user?.name || "User"}</span>
                <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
              </div>
            )}
          </div>
        </nav>
      )}
    </>
  );
}

export default Navbar;
