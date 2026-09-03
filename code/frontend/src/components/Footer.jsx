import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <Link to="/" className="logo footer-logo">
            <span className="logo-mark">S</span>
            <span>ServeConnect</span>
          </Link>

          <p>
            Connecting customers with trusted local service professionals.
          </p>
        </div>

        <div className="footer-links">
          <div>
            <h4>Platform</h4>
            <Link to="/search">Find Workers</Link>
            <Link to="/worker/register">Join as Worker</Link>
          </div>

          <div>
            <h4>Account</h4>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 ServeConnect. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;