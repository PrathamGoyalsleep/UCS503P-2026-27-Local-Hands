import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyBookings, updateBookingStatus } from "../services/bookingService";
import { Link } from "react-router-dom";

const statusConfig = {
  pending:   { color: "#F59E0B", bg: "#FFFBEB", border: "#FCD34D", label: "Pending Review" },
  accepted:  { color: "#10B981", bg: "#F0FDF4", border: "#6EE7B7", label: "Accepted" },
  rejected:  { color: "#EF4444", bg: "#FFF1F2", border: "#FCA5A5", label: "Rejected" },
  completed: { color: "#6366F1", bg: "#EEF2FF", border: "#A5B4FC", label: "Completed" },
  paid:      { color: "#8B5CF6", bg: "#F5F3FF", border: "#C4B5FD", label: "Paid" },
};

function Bookings() {
  const { token, user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchBookings = async () => {
    try {
      const data = await getMyBookings(token);
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateBookingStatus(token, id, status);
      fetchBookings();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredBookings = filter === "all" ? bookings : bookings.filter(b => b.status === filter);

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid #e5e7eb", borderTop: "3px solid var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "#9ca3af" }}>Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8faff", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>

        {/* Page Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#1a1a2e", marginBottom: "0.3rem" }}>
            {user?.role === "worker" ? "Job Requests" : "My Bookings"}
          </h1>
          <p style={{ color: "#6b7280" }}>
            {user?.role === "worker"
              ? "Manage incoming service requests and track your jobs."
              : "View and manage all your booked services."}
          </p>
        </div>

        {/* Stats Bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "Total", value: bookings.length, color: "#6366F1" },
            { label: "Pending", value: bookings.filter(b => b.status === "pending").length, color: "#F59E0B" },
            { label: "Accepted", value: bookings.filter(b => b.status === "accepted").length, color: "#10B981" },
            { label: "Completed", value: bookings.filter(b => b.status === "completed").length, color: "#8B5CF6" },
          ].map(stat => (
            <div key={stat.label} style={{ background: "white", borderRadius: "12px", padding: "1.25rem", border: "1px solid #e5e7eb", textAlign: "center" }}>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: "0.85rem", color: "#9ca3af", marginTop: "0.2rem" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
          {["all", "pending", "accepted", "completed", "rejected"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "0.5rem 1.25rem", borderRadius: "30px", border: "1.5px solid", cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap", transition: "all 0.2s",
              borderColor: filter === f ? "var(--primary)" : "#e5e7eb",
              background: filter === f ? "var(--primary)" : "white",
              color: filter === f ? "white" : "#6b7280"
            }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== "all" && bookings.filter(b => b.status === f).length > 0 && (
                <span style={{ marginLeft: "0.4rem", background: filter === f ? "rgba(255,255,255,0.25)" : "#e5e7eb", borderRadius: "10px", padding: "0.1rem 0.4rem", fontSize: "0.75rem" }}>
                  {bookings.filter(b => b.status === f).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div style={{ background: "white", borderRadius: "16px", padding: "4rem 2rem", textAlign: "center", border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📋</div>
            <h3 style={{ color: "#1a1a2e", marginBottom: "0.5rem" }}>No bookings found</h3>
            <p style={{ color: "#9ca3af", marginBottom: "1.5rem" }}>
              {filter === "all" ? "You don't have any bookings yet." : `No ${filter} bookings at the moment.`}
            </p>
            {user?.role === "customer" && filter === "all" && (
              <Link to="/search" className="btn btn-primary">Find a Service</Link>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {filteredBookings.map((booking) => {
              const sc = statusConfig[booking.status] || statusConfig.pending;
              return (
                <div key={booking._id} style={{
                  background: "white", borderRadius: "16px", border: "1px solid #e5e7eb",
                  overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.04)"
                }}>
                  {/* Card Top Bar */}
                  <div style={{ height: "4px", background: sc.color }} />
                  
                  <div style={{ padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      {/* Status + Date */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                        <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, padding: "0.3rem 0.8rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 600 }}>
                          ● {sc.label}
                        </span>
                        <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                          📅 {booking.date} &nbsp;|&nbsp; 🕐 {booking.time}
                        </span>
                      </div>

                      {/* Person Info */}
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem" }}>
                        <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "linear-gradient(135deg, var(--primary), #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "1.1rem", flexShrink: 0 }}>
                          {user?.role === "worker"
                            ? (booking.customerId?.name?.charAt(0) || "C")
                            : (booking.workerId?.userId?.name?.charAt(0) || "W")}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "#1a1a2e", fontSize: "1rem" }}>
                            {user?.role === "worker"
                              ? booking.customerId?.name || "Customer"
                              : booking.workerId?.userId?.name || "Worker"}
                          </div>
                          <div style={{ color: "#9ca3af", fontSize: "0.85rem" }}>
                            {user?.role === "worker"
                              ? booking.customerId?.phone || "No phone"
                              : booking.workerId?.category || "Service"}
                          </div>
                        </div>
                      </div>

                      {booking.notes && (
                        <div style={{ background: "#f9fafb", borderRadius: "8px", padding: "0.6rem 0.9rem", fontSize: "0.88rem", color: "#374151", borderLeft: "3px solid #e5e7eb" }}>
                          <strong>Note:</strong> {booking.notes}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
                      {user?.role === "worker" && booking.status === "pending" && (
                        <>
                          <button onClick={() => handleStatusUpdate(booking._id, "accepted")}
                            style={{ padding: "0.6rem 1.25rem", background: "#10B981", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            ✓ Accept
                          </button>
                          <button onClick={() => handleStatusUpdate(booking._id, "rejected")}
                            style={{ padding: "0.6rem 1.25rem", background: "white", color: "#EF4444", border: "1.5px solid #FCA5A5", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}>
                            ✕ Decline
                          </button>
                        </>
                      )}
                      {user?.role === "worker" && booking.status === "accepted" && (
                        <button onClick={() => handleStatusUpdate(booking._id, "completed")}
                          style={{ padding: "0.6rem 1.25rem", background: "var(--primary)", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}>
                          Mark Complete ✓
                        </button>
                      )}
                      {booking.status === "completed" && (
                        <span style={{ color: "#10B981", fontWeight: 600, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          ✓ Service Done
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Bookings;
