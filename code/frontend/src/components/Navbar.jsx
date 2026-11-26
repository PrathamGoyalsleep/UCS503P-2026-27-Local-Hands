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
    navigate("/login", { replace: true });
  }

  // Do not render top navigation on full-screen split-screen auth pages
  if (routerLocation.pathname === "/login" || routerLocation.pathname === "/register") {
    return null;
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
        <div style={styles.headerInner}>
          {/* Left: Logo + Location Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <Link to="/" className="nav-logo" onClick={() => setIsMenuOpen(false)} style={styles.logoLink}>
              <span style={styles.logoIcon}>S</span>
              <span className="nav-logo-text" style={styles.logoText}>ServeConnect</span>
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
                  borderColor: isDropdownOpen ? "#1E4E8C" : "#E2E8F0",
                  background: isDropdownOpen ? "#EEF4FB" : "#F8FAFC",
                }}
              >
                <MapPin size={13} color="#1E4E8C" />
                <span style={styles.locationCityName}>
                  {isDetecting ? "Detecting..." : location}
                </span>
                <ChevronDown
                  size={12}
                  color="#64748B"
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
                      <Search size={14} color="#94A3B8" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search city..."
                        value={citySearch}
                        onChange={(e) => setCitySearch(e.target.value)}
                        style={styles.dropdownSearchInput}
                      />
                      {citySearch && (
                        <button type="button" onClick={() => setCitySearch("")} style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", display: "flex", alignItems: "center" }} aria-label="Clear search">
                          <X size={13} />
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
                        <Navigation size={13} color="#1E4E8C" />
                      )}
                    </div>
                    <div>
                      <div style={{ color: "#0F172A", fontWeight: 600, fontSize: "0.84rem" }}>
                        {isDetecting ? "Detecting GPS location..." : "Use Current Location"}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "#64748B" }}>
                        GPS auto-detection via browser
                      </div>
                    </div>
                  </div>

                  {/* Location Error Notice */}
                  {locationError && (
                    <div style={styles.errorNotice} role="alert">
                      <AlertTriangle size={13} color="#D97706" />
                      <span>{locationError}</span>
                    </div>
                  )}

                  {/* City Options List */}
                  <div style={{ padding: "0.45rem 1rem", fontSize: "0.7rem", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                    Service Areas
                  </div>

                  <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {filteredCities.length === 0 ? (
                      <div style={{ padding: "0.75rem 1rem", fontSize: "0.82rem", color: "#64748B" }}>
                        <div>"{citySearch}" is not in official service areas.</div>
                        <button
                          type="button"
                          onClick={() => handleSelectCity(citySearch.trim())}
                          style={{ marginTop: "0.4rem", color: "#1E4E8C", background: "none", border: "none", fontWeight: 600, fontSize: "0.8rem", cursor: "pointer", padding: 0 }}
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
                              background: isCurrent ? "#EEF4FB" : "transparent",
                              fontWeight: isCurrent ? 600 : 400,
                            }}
                            onClick={() => handleSelectCity(city)}
                            onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.background = "#F8FAFC"; }}
                            onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.background = "transparent"; }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <MapPin size={12} color={isCurrent ? "#1E4E8C" : "#94A3B8"} />
                              <span style={{ color: isCurrent ? "#1E4E8C" : "#334155" }}>{city}</span>
                            </div>
                            {isCurrent && <Check size={13} color="#1E4E8C" />}
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
                color: isActive("/") ? "#0F172A" : "#475569",
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
                color: isActive("/search") ? "#0F172A" : "#475569",
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
                  color: isActive("/bookings") ? "#0F172A" : "#475569",
                  fontWeight: isActive("/bookings") ? 700 : 500,
                }}
              >
                {user?.role === "worker" ? "Job Dashboard" : "My Bookings"}
                {isActive("/bookings") && <span style={styles.activeDot} />}
              </Link>
            )}

            {isAuthenticated && (
              <Link
                to="/profile"
                style={{
                  ...styles.navLink,
                  color: isActive("/profile") ? "#0F172A" : "#475569",
                  fontWeight: isActive("/profile") ? 700 : 500,
                }}
              >
                Profile
                {isActive("/profile") && <span style={styles.activeDot} />}
              </Link>
            )}

            {isAuthenticated && user?.role === "admin" && (
              <Link
                to="/admin"
                style={{
                  ...styles.navLink,
                  color: isActive("/admin") ? "#0F172A" : "#475569",
                  fontWeight: isActive("/admin") ? 700 : 500,
                }}
              >
                Admin Panel
                {isActive("/admin") && <span style={styles.activeDot} />}
              </Link>
            )}
          </nav>

          {/* Right: Actions */}
          <div className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  style={styles.loginBtn}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#2563EB"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#334155"; }}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  style={styles.getStartedBtn}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#1D4ED8"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#2563EB"}
                >
                  Get Started
                </Link>
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Link
                  to="/profile"
                  style={{ ...styles.userBadge, textDecoration: "none" }}
                  title="View Account & Profile"
                >
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user?.name || "Profile"}
                      style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={styles.userInitials}>
                      {user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                  <span style={{ fontWeight: 600, fontSize: "0.84rem", color: "#0F172A" }}>
                    {user?.name?.split(" ")[0]}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  style={styles.logoutBtn}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#CBD5E1"; e.currentTarget.style.color = "#0F172A"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.color = "#64748B"; }}
                >
                  <LogOut size={13} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Hamburger (Mobile) */}
          <button className="nav-hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle navigation menu" aria-expanded={isMenuOpen} style={{ background: "none", border: "none", cursor: "pointer", display: "none" }}>
            {isMenuOpen ? (
              <X size={20} color="#0F172A" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <nav className="nav-mobile-menu animate-slide-up" aria-label="Mobile navigation" style={styles.mobileDrawer}>
          <Link to="/" onClick={() => setIsMenuOpen(false)} style={styles.mobileLink}>Home</Link>
          <Link to="/search" onClick={() => setIsMenuOpen(false)} style={styles.mobileLink}>Find Professionals</Link>
          {isAuthenticated && <Link to="/bookings" onClick={() => setIsMenuOpen(false)} style={styles.mobileLink}>{user?.role === "worker" ? "Job Dashboard" : "My Bookings"}</Link>}
          {isAuthenticated && <Link to="/profile" onClick={() => setIsMenuOpen(false)} style={styles.mobileLink}>My Profile</Link>}
          {isAuthenticated && user?.role === "admin" && <Link to="/admin" onClick={() => setIsMenuOpen(false)} style={styles.mobileLink}>Admin Panel</Link>}
          <div style={{ borderTop: "1px solid #E2E8F0", margin: "0.75rem 0" }} />
          {!isAuthenticated ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <Link to="/login" onClick={() => setIsMenuOpen(false)} style={styles.mobileLink}>Login</Link>
              <Link to="/register" style={styles.mobileGetStarted} onClick={() => setIsMenuOpen(false)}>Get Started</Link>
            </div>
          ) : (
            <button onClick={handleLogout} style={styles.mobileLogoutBtn}>
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
    background: "#FFFFFF",
    borderBottom: "1px solid #E5E7EB",
    position: "sticky",
    top: 0,
    zIndex: 200,
    width: "100%",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  },
  headerInner: {
    width: "100%",
    maxWidth: "var(--container-max, 1680px)",
    paddingLeft: "var(--page-gutter, 1.5rem)",
    paddingRight: "var(--page-gutter, 1.5rem)",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "64px",
    padding: "0",
  },
  logoLink: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    textDecoration: "none",
  },
  logoIcon: {
    background: "#1E4E8C",
    color: "#FFFFFF",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    fontSize: "0.95rem",
    fontWeight: 800,
    flexShrink: 0,
    boxShadow: "0 2px 8px rgba(30, 78, 140, 0.25)",
  },
  logoText: {
    color: "#0F1D38",
    fontWeight: 800,
    fontSize: "1.12rem",
    letterSpacing: "-0.025em",
    fontFamily: "'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif",
  },
  locationButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.35rem 0.75rem",
    borderRadius: "100px",
    border: "1px solid #E2E8F0",
    background: "#F8FAFC",
    cursor: "pointer",
    fontSize: "0.82rem",
    fontWeight: 500,
    color: "#334155",
    transition: "all 140ms ease",
  },
  locationCityName: {
    maxWidth: "clamp(60px, 15vw, 110px)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    color: "#334155",
    fontWeight: 600,
  },
  dropdownPanel: {
    position: "absolute",
    top: "calc(100% + 8px)",
    left: 0,
    width: "280px",
    maxWidth: "calc(100vw - 2rem)",
    background: "#FFFFFF",
    borderRadius: "12px",
    border: "1px solid #E2E8F0",
    boxShadow: "0 16px 40px rgba(0, 0, 0, 0.12)",
    zIndex: 1000,
    overflow: "hidden",
  },
  searchBoxWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
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
    borderTop: "1px solid #E2E8F0",
    borderBottom: "1px solid #E2E8F0",
    cursor: "pointer",
    transition: "background 140ms ease",
  },
  detectIconWrapper: {
    width: "26px",
    height: "26px",
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
    borderTopColor: "#2563EB",
    animation: "spin 0.8s linear infinite",
    display: "inline-block",
  },
  errorNotice: {
    padding: "0.5rem 1rem",
    fontSize: "0.76rem",
    color: "#D97706",
    background: "#FEF3C7",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
  },
  cityOptionItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.55rem 1rem",
    fontSize: "0.84rem",
    cursor: "pointer",
    transition: "background 140ms ease",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "1.75rem",
  },
  navLink: {
    position: "relative",
    fontSize: "0.88rem",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: "0.25rem 0",
    transition: "color 140ms ease",
  },
  activeDot: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    background: "#1E4E8C",
    display: "inline-block",
    marginLeft: "2px",
  },
  loginBtn: {
    fontWeight: 600,
    color: "#334155",
    fontSize: "0.88rem",
    padding: "0.45rem 0.9rem",
    borderRadius: "8px",
    transition: "color 140ms ease",
    textDecoration: "none",
  },
  getStartedBtn: {
    display: "inline-flex",
    alignItems: "center",
    background: "linear-gradient(135deg, #1E4E8C, #2A64AC)",
    color: "#FFFFFF",
    padding: "0.5rem 1.15rem",
    borderRadius: "8px",
    fontWeight: 700,
    fontSize: "0.88rem",
    textDecoration: "none",
    transition: "all 180ms ease",
    border: "none",
    boxShadow: "0 2px 10px rgba(30, 78, 140, 0.25)",
    fontFamily: "'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif",
  },
  userBadge: {
    display: "flex",
    alignItems: "center",
    gap: "0.45rem",
    background: "#EEF4FB",
    padding: "0.3rem 0.65rem",
    borderRadius: "100px",
    border: "1px solid #CBDDF2",
  },
  userInitials: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "#1E4E8C",
    color: "#FFFFFF",
    fontSize: "0.75rem",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
    padding: "0.42rem 0.75rem",
    fontSize: "0.82rem",
    fontWeight: 500,
    color: "#64748B",
    background: "none",
    border: "1px solid #E2E8F0",
    borderRadius: "7px",
    cursor: "pointer",
    transition: "border-color 140ms ease, color 140ms ease",
  },
  mobileDrawer: {
    background: "#FFFFFF",
    borderBottom: "1px solid #E5E7EB",
    padding: "1.25rem 5%",
  },
  mobileLink: {
    color: "#0F172A",
    padding: "0.6rem 0",
    display: "block",
    fontSize: "0.95rem",
    fontWeight: 500,
  },
  mobileGetStarted: {
    background: "#2563EB",
    color: "#FFFFFF",
    padding: "0.65rem 1rem",
    borderRadius: "8px",
    fontWeight: 600,
    textAlign: "center",
    display: "block",
    textDecoration: "none",
    marginTop: "0.5rem",
  },
  mobileLogoutBtn: {
    padding: "0.65rem 0",
    background: "none",
    border: "none",
    color: "#DC2626",
    fontWeight: 600,
    textAlign: "left",
    width: "100%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    fontSize: "0.95rem",
  },
};
