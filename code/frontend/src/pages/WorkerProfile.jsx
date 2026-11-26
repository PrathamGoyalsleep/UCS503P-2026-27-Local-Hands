import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getWorkerById } from "../services/workerService";
import WorkerProfileModal from "../components/WorkerProfileModal";
import { ArrowLeft, AlertCircle } from "lucide-react";

const palette = {
  bgPrimary: "var(--color-bg-soft, #F1F5FC)",
  bgSecondary: "var(--color-bg-secondary, #EAF1FC)",
  bgSurface: "var(--color-surface, #FFFFFF)",
  bgDark: "var(--color-navy, #142B55)",
  textPrimary: "var(--color-text-primary, #172554)",
  textSecondary: "var(--color-text-secondary, #64748B)",
  textMuted: "var(--color-text-muted, #94A3B8)",
  brandPrimary: "var(--color-primary, #1E4E8C)",
  border: "var(--color-border, #DCE6F5)",
  borderSubtle: "var(--color-border-subtle, #E2E8F0)",
};

export default function WorkerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getWorkerById(id);
        setWorker(data);
      } catch (err) {
        setError(err.message || "Failed to load professional profile.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: palette.bgPrimary,
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div
          style={{
            width: "40px",
            height: "40px",
            border: `3px solid ${palette.borderSubtle}`,
            borderTopColor: palette.brandPrimary,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p style={{ marginTop: "1rem", color: palette.textSecondary, fontWeight: 600, fontSize: "0.9rem" }}>
          Loading profile...
        </p>
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          textAlign: "center",
          background: palette.bgPrimary,
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        <AlertCircle size={44} color="#B34F52" style={{ marginBottom: "1rem" }} />
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: palette.textPrimary, marginBottom: "0.5rem" }}>
          Professional Not Found
        </h2>
        <p style={{ color: palette.textSecondary, marginBottom: "1.5rem", fontSize: "0.92rem" }}>
          {error || "The requested service partner could not be loaded."}
        </p>
        <Link
          to="/search"
          style={{
            padding: "0.7rem 1.5rem",
            borderRadius: "8px",
            background: palette.brandPrimary,
            color: "white",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "0.9rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Directory</span>
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        background: palette.bgPrimary,
        minHeight: "100vh",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        paddingBottom: "4rem",
      }}
    >
      {/* Back link */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem 2rem 0" }}>
        <Link
          to="/search"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            color: palette.brandPrimary,
            fontWeight: 700,
            fontSize: "0.88rem",
            textDecoration: "none",
            transition: "opacity 160ms ease",
          }}
        >
          <ArrowLeft size={15} />
          <span>Back to Search</span>
        </Link>
      </div>

      {/* Profile modal rendered as page */}
      <WorkerProfileModal
        workerId={id}
        initialWorker={worker}
        onClose={() => navigate("/search")}
        onBookingSuccess={() => navigate("/bookings")}
      />
    </div>
  );
}
