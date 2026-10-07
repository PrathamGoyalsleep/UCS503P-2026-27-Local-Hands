import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="page" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 1.5rem", textAlign: "center" }}>
      <span style={{ fontSize: "var(--fs-2xl, 2.25rem)", fontWeight: 900, color: "var(--primary)" }}>404</span>
      <h1 style={{ fontSize: "var(--fs-xl, 1.75rem)", fontWeight: 800, marginTop: "0.5rem", marginBottom: "0.75rem", color: "var(--text-main)" }}>
        Page Not Found
      </h1>
      <p style={{ color: "#4b5563", maxWidth: "460px", marginBottom: "2rem", fontSize: "var(--fs-base, 1rem)" }}>
        The page you are looking for doesn't exist, has been removed, or is temporarily unavailable.
      </p>
      <Link to="/" className="btn btn-primary">
        Back to Home
      </Link>
    </div>
  );
}

export default NotFound;
