import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getWorkerById } from "../services/workerService";
import WorkerProfileModal from "../components/WorkerProfileModal";
import { ArrowLeft, AlertCircle } from "lucide-react";

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
      <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "44px", height: "44px", border: "4px solid #E5E7EB", borderTopColor: "var(--primary, #2563EB)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ marginTop: "1rem", color: "#6B7280", fontWeight: 600 }}>Loading verified professional profile...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", textAlign: "center" }}>
        <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
          <AlertCircle size={48} color="#EF4444" />
        </div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827", marginBottom: "0.5rem" }}>
          Professional Not Found
        </h2>
        <p style={{ color: "#6B7280", marginBottom: "1.5rem" }}>
          {error || "The requested service partner could not be loaded."}
        </p>
        <Link to="/search" className="btn btn-primary" style={{ padding: "0.75rem 1.75rem", borderRadius: "10px", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
          <ArrowLeft size={16} />
          <span>Back to Directory</span>
        </Link>
      </div>
    );
  }

  // Render the comprehensive interactive profile view in page mode
  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", padding: "1.5rem 1rem 4rem" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto 1.5rem" }}>
        <Link
          to="/search"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--primary)",
            fontWeight: 700,
            fontSize: "0.92rem",
            textDecoration: "none",
            background: "white",
            padding: "0.5rem 1rem",
            borderRadius: "10px",
            border: "1px solid #E2E8F0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Search Directory</span>
        </Link>
      </div>

      <WorkerProfileModal
        workerId={id}
        initialWorker={worker}
        onClose={() => navigate("/search")}
        onBookingSuccess={() => navigate("/bookings")}
      />
    </div>
  );
}
