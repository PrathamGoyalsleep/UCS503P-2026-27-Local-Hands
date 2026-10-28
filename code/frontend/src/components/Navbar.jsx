import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLocationState } from "../context/LocationContext";
import { useState, useRef, useEffect } from "react";
import {
  MapPin,
  Search,
  Navigation,
  ChevronDown,
  Check,
  X,
  AlertTriangle,
  UserRound,
  LogOut,
} from "lucide-react";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { location, setLocation, detectLocation, isDetecting, locationError, supportedCities } = useLocationState();
  const navigate = useNavigate();
  const routerLocation = useLocation();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

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
  }, [routerLocation.pathname]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setCitySearch("");
    }
  }, [isDropdownOpen]);

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

  const handleCustomCitySubmit = (e) => {
    e.preventDefault();
    if (citySearch.trim()) {
      handleSelectCity(citySearch.trim());
    }
  };

  const filteredCities = (supportedCities || ["Patiala", "Delhi", "Chandigarh", "Ludhiana", "Mohali"]).filter(c =>
    c.toLowerCase().includes(citySearch.toLowerCase().trim())
  );

  const isActive = (path) => routerLocation.pathname === path;

  return (
    <>
      <header className="navbar" style={styles.header}>
        {/* Left: Logo + Location Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <Link to="/" className="nav-logo" onClick={() => setIsMenuOpen(false)} style={styles.logoLink}>
            <span className="nav-logo-icon">S</span>
            <span className="nav-logo-text">ServeConnect</span>
          </Link>

          {/* Interactive Location Dropdown */}
          <div ref={dropdownRef} style={{ position: "relative" }} className="nav-location-wrapper">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="nav-location-btn"
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
              aria-label={`Select city. Currently set to ${location}`}
              style={{
                ...styles.locationButton,
                borderColor: isDropdownOpen ? "var(--primary)" : "#E2E8F0",
                background: isDropdownOpen ? "#EFF6FF" : "#F8FAFC",
              }}
            >
              <MapPin size={16} color="var(--primary)" />
              <span style={styles.locationCityName}>
                {isDetecting ? "Detecting..." : location}
              </span>
              <ChevronDown
                size={14}
                style={{
                  transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0)",
                  transition: "transform 0.2s ease"
                }}
              />
            </button>

            {isDropdownOpen && (
              <div role="listbox" aria-label="Available cities" style={styles.dropdownPanel} className="animate-slide-up">
                
                {/* Search Bar inside Location Picker */}
                <form onSubmit={handleCustomCitySubmit} style={{ padding: "0.75rem 0.85rem 0.5rem" }}>
                  <div style={styles.searchBoxWrapper}>
                    <Search size={14} color="#64748B" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search or enter city..."
                      value={citySearch}
                      onChange={(e) => setCitySearch(e.target.value)}
                      style={styles.dropdownSearchInput}
                    />
                    {citySearch && (
                      <button type="button" onClick={() => setCitySearch("")} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", display: "flex", alignItems: "center" }} aria-label="Clear search">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </form>

                {/* GPS Auto-detect Button */}
                <div
                  role="option"
                  aria-selected={false}
                  tabIndex={0}
                  style={styles.detectOption}
                  onClick={handleDetect}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#EFF6FF"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#F8FAFC"}
                >
                  <div style={styles.detectIconWrapper}>
                    {isDetecting ? (
                      <span style={styles.miniSpinner} />
                    ) : (
                      <Navigation size={15} color="var(--primary)" />
                    )}
                  </div>
                  <div>
                    <div style={{ color: "var(--primary)", fontWeight: 700, fontSize: "0.86rem" }}>
                      {isDetecting ? "Detecting GPS location..." : "Use Current Location"}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "#64748B" }}>
                      GPS auto-detection via browser
                    </div>
                  </div>
                </div>

                {locationError && (
                  <div style={styles.errorNotice}>
                    <AlertTriangle size={14} color="#D97706" style={{ flexShrink: 0 }} />
                    <span>{locationError}</span>
                  </div>
                )}

                {/* City Options List */}
                <div style={{ padding: "0.4rem 1rem", fontSize: "0.72rem", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.8px", fontWeight: 700 }}>
                  Supported Service Areas
                </div>

                <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                  {filteredCities.length === 0 ? (
                    <div style={{ padding: "0.75rem 1rem", fontSize: "0.84rem", color: "#64748B" }}>
                      <div>"{citySearch}" is not in official service areas.</div>
                      <button
                        type="button"
                        onClick={() => handleSelectCity(citySearch.trim())}
                        style={{ marginTop: "0.4rem", color: "var(--primary)", background: "none", border: "none", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", padding: 0 }}
                      >
                        Search "{citySearch}" anyway &rarr;
                      </button>
                    </div>
                  ) : (
                    filteredCities.map((city) => {
                      const isCurrent = location.toLowerCase() === city.toLowerCase();
                      return (
                        <div
                          key={city}
                          role="option"
                          aria-selected={isCurrent}
                          tabIndex={0}
                          style={{
                            ...styles.cityOptionItem,
                            background: isCurrent ? "#F1F5F9" : "transparent",
                            fontWeight: isCurrent ? 700 : 500,
                          }}
                          onClick={() => handleSelectCity(city)}
                          onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.background = "#F8FAFC"; }}
                          onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.background = "transparent"; }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <MapPin size={13} color={isCurrent ? "var(--primary)" : "#94A3B8"} />
                            <span style={{ color: isCurrent ? "var(--primary)" : "#1E293B" }}>{city}</span>
                          </div>
                          {isCurrent && <Check size={14} color="var(--primary)" />}
                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Center Nav Links (Desktop) with active indicators */}
        <nav className="nav-links nav-desktop" aria-label="Main navigation" style={styles.navLinks}>
          <Link
            to="/"
            style={{
              ...styles.navLink,
              color: isActive("/") ? "var(--primary)" : "#475569",
              fontWeight: isActive("/") ? 700 : 500,
            }}
          >
            Home
            {isActive("/") && <span style={styles.activeDot} />}
          </Link>

          <Link
            to="/search"
            style={{
              ...styles.navLink,
              color: isActive("/search") ? "var(--primary)" : "#475569",
              fontWeight: isActive("/search") ? 700 : 500,
            }}
          >
            Find Professionals
            {isActive("/search") && <span style={styles.activeDot} />}
          </Link>

          {isAuthenticated && (
            <Link
              to="/bookings"
              style={{
                ...styles.navLink,
                color: isActive("/bookings") ? "var(--primary)" : "#475569",
                fontWeight: isActive("/bookings") ? 700 : 500,
              }}
            >
              My Bookings
              {isActive("/bookings") && <span style={styles.activeDot} />}
            </Link>
          )}

          {isAuthenticated && user?.role === "admin" && (
            <Link
              to="/admin"
              style={{
                ...styles.navLink,
                color: isActive("/admin") ? "var(--primary)" : "#475569",
                fontWeight: isActive("/admin") ? 700 : 500,
              }}
            >
              Admin Panel
              {isActive("/admin") && <span style={styles.activeDot} />}
            </Link>
          )}
        </nav>

        {/* Right: Auth Profile / Buttons (Desktop) */}
        <div className="nav-desktop" style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {!isAuthenticated ? (
            <>
              <Link to="/login" style={{ fontWeight: 600, color: "#475569", fontSize: "0.9rem", padding: "0.5rem 0.75rem" }}>
                Login
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: "0.6rem 1.25rem", fontSize: "0.9rem", borderRadius: "10px" }}>
                Get Started
              </Link>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
              <div style={styles.userBadge}>
                <div style={styles.userInitials}>
                  {user?.name?.charAt(0) || "U"}
                </div>
                <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#0F172A" }}>
                  {user?.name?.split(" ")[0]}
                </span>
              </div>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: "0.5rem 0.9rem", fontSize: "0.84rem", borderRadius: "8px", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>

        {/* Hamburger (Mobile) */}
        <button className="nav-hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle navigation menu" aria-expanded={isMenuOpen}>
          {isMenuOpen ? (
            <X size={22} color="currentColor" />
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
      </header>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <nav className="nav-mobile-menu animate-slide-up" aria-label="Mobile navigation">
          <Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
          <Link to="/search" onClick={() => setIsMenuOpen(false)}>Find Professionals</Link>
          {isAuthenticated && <Link to="/bookings" onClick={() => setIsMenuOpen(false)}>My Bookings</Link>}
          {isAuthenticated && user?.role === "admin" && <Link to="/admin" onClick={() => setIsMenuOpen(false)}>Admin Panel</Link>}
          <div style={{ borderTop: "1px solid #E2E8F0", margin: "0.75rem 0" }} />
          {!isAuthenticated ? (
            <>
              <Link to="/login" onClick={() => setIsMenuOpen(false)}>Login</Link>
              <Link to="/register" className="btn btn-primary" style={{ margin: "0.5rem 1rem", textAlign: "center", color: "white" }} onClick={() => setIsMenuOpen(false)}>Get Started</Link>
            </>
          ) : (
            <button onClick={handleLogout} style={{ padding: "0.75rem 1rem", background: "none", border: "none", color: "#EF4444", fontWeight: 700, textAlign: "left", width: "100%", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <LogOut size={14} />
              <span>Logout ({user?.name})</span>
            </button>
          )}
        </nav>
      )}
    </>
  );
}

const styles = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0.85rem 5%",
    background: "#FFFFFF",
    borderBottom: "1px solid #E2E8F0",
    position: "sticky",
    top: 0,
    zIndex: 100,
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
  },
  logoLink: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    textDecoration: "none",
  },
  locationButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.45rem",
    padding: "0.45rem 0.85rem",
    borderRadius: "12px",
    border: "1.5px solid #E2E8F0",
    cursor: "pointer",
    fontSize: "0.86rem",
    fontWeight: 600,
    color: "#1E293B",
    transition: "all 0.15s ease",
  },
  locationCityName: {
    maxWidth: "130px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  dropdownPanel: {
    position: "absolute",
    top: "calc(100% + 8px)",
    left: 0,
    width: "280px",
    background: "#FFFFFF",
    borderRadius: "16px",
    border: "1px solid #E2E8F0",
    boxShadow: "0 16px 36px -4px rgba(0,0,0,0.14)",
    zIndex: 1000,
    overflow: "hidden",
  },
  searchBoxWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "#F8FAFC",
    border: "1px solid #CBD5E1",
    borderRadius: "10px",
    padding: "0.45rem 0.65rem",
  },
  dropdownSearchInput: {
    width: "100%",
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: "0.84rem",
    color: "#0F172A",
  },
  detectOption: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.65rem 1rem",
    background: "#F8FAFC",
    borderTop: "1px solid #F1F5F9",
    borderBottom: "1px solid #F1F5F9",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  detectIconWrapper: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "#EFF6FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  miniSpinner: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    border: "2px solid #BFDBFE",
    borderTopColor: "var(--primary)",
    animation: "spin 0.8s linear infinite",
    display: "inline-block",
  },
  errorNotice: {
    padding: "0.5rem 1rem",
    fontSize: "0.78rem",
    color: "#92400E",
    background: "#FFFBEB",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
  },
  cityOptionItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.55rem 1rem",
    fontSize: "0.86rem",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "1.75rem",
  },
  navLink: {
    position: "relative",
    fontSize: "0.92rem",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: "0.25rem 0",
    transition: "color 0.15s",
  },
  activeDot: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    background: "var(--primary)",
    display: "inline-block",
  },
  userBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "#F8FAFC",
    padding: "0.35rem 0.75rem",
    borderRadius: "20px",
    border: "1px solid #E2E8F0",
  },
  userInitials: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "var(--primary)",
    color: "white",
    fontSize: "0.75rem",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }
};
