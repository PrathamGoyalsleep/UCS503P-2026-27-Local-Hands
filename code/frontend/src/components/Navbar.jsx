import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="logo">
          <span className="logo-mark">S</span>
          <span>ServeConnect</span>
        </Link>

        <nav className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/search">Find Workers</Link>

          {isAuthenticated && <Link to="/worker/register">Join as Worker</Link>}
        </nav>

        <div className="nav-actions">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="nav-login">
                Login
              </Link>

              <Link to="/register" className="nav-register">
                Get Started
              </Link>
            </>
          ) : (
            <>
              <span className="nav-user">Hi, {user?.name || "User"}</span>

              <button
                type="button"
                className="nav-logout"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
