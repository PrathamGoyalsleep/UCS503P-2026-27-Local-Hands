import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLocationState } from "../context/LocationContext";
import { useState, useRef, useEffect } from "react";

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { location, setLocation, detectLocation } = useLocationState();
  const navigate = useNavigate();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

  function handleLogout() {
    logout();
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
    <header className="navbar" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link to="/" className="nav-logo">
          <span className="nav-logo-icon">S</span>
          ServeConnect
        </Link>
        
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontSize: '0.95rem', background: 'var(--bg-light)', padding: '0.5rem 0.8rem', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s' }} 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="nav-location-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span style={{ fontWeight: 500 }}>{location}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}><path d="m6 9 6 6 6-6"/></svg>
          </div>

          {isDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '110%',
              left: '0',
              background: 'white',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              borderRadius: '8px',
              width: '220px',
              zIndex: 1000,
              padding: '0.5rem 0',
              border: '1px solid var(--border)'
            }}>
              <div 
                style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--bg-light)' }}
                onClick={handleDetect}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"></path><path d="M12 18v4"></path><path d="M2 12h4"></path><path d="M18 12h4"></path><circle cx="12" cy="12" r="4"></circle></svg>
                <span style={{ color: 'var(--primary)', fontWeight: 500 }}>Detect Current Location</span>
              </div>
              
              <div style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Popular Cities
              </div>
              
              {popularCities.map(city => (
                <div 
                  key={city}
                  style={{ padding: '0.5rem 1rem', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  onClick={() => handleSelectCity(city)}
                  onMouseEnter={(e) => e.target.style.background = 'var(--bg-light)'}
                  onMouseLeave={(e) => e.target.style.background = 'white'}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path></svg>
                  {city}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <nav className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/search">Find Workers</Link>
        {isAuthenticated && <Link to="/bookings">My Bookings</Link>}
        {isAuthenticated && user?.role === "admin" && <Link to="/admin">Admin Panel</Link>}
      </nav>

      <div className="nav-links">
        {!isAuthenticated ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn btn-primary">Get Started</Link>
          </>
        ) : (
          <>
            <span style={{fontWeight: 600}}>Hi, {user?.name || "User"}</span>
            <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
          </>
        )}
      </div>
    </header>
  );
}

export default Navbar;
