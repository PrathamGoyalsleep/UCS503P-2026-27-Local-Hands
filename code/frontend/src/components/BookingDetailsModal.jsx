import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Clock3,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Wrench,
  MapPin,
  FileText,
  Phone,
  MessageCircle,
  Check,
  X,
  AlertTriangle
} from "lucide-react";

const statusConfig = {
  pending:   { color: "#D97706", bg: "#FFFBEB", border: "#FCD34D", label: "Pending Confirmation", step: 1, Icon: Clock },
  accepted:  { color: "#059669", bg: "#F0FDF4", border: "#6EE7B7", label: "Accepted & Confirmed", step: 2, Icon: CheckCircle2 },
  completed: { color: "#4F46E5", bg: "#EEF2FF", border: "#A5B4FC", label: "Service Completed", step: 4, Icon: CheckCircle2 },
  rejected:  { color: "#DC2626", bg: "#FFF1F2", border: "#FCA5A5", label: "Booking Declined", step: 0, Icon: XCircle },
  paid:      { color: "#7C3AED", bg: "#F5F3FF", border: "#C4B5FD", label: "Paid & Verified", step: 4, Icon: CheckCircle2 },
};

export default function BookingDetailsModal({ booking, user, onClose, onStatusUpdate }) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!booking) return null;

  const sc = statusConfig[booking.status] || statusConfig.pending;
  const StatusIcon = sc.Icon;
  const isWorker = user?.role === "worker";
  const partnerName = isWorker
    ? (booking.customerId?.name || "Customer")
    : (booking.workerId?.userId?.name || "Service Partner");
  const partnerRole = isWorker ? "Customer" : (booking.workerId?.category || "Professional");
  const partnerPhone = isWorker ? booking.customerId?.phone : booking.workerId?.phone;
  const bookingRef = `#SC-${booking._id ? booking._id.slice(-6).toUpperCase() : "REQ"}`;

  const currentStep = sc.step;

  const handleOpenChat = () => {
    onClose();
    navigate(`/chat/${booking._id}`);
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-booking-title">
      <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()} className="animate-modal">
        
        {/* Top Header Bar */}
        <div style={styles.modalHeader}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.25rem" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--primary)", background: "#EFF6FF", padding: "0.2rem 0.6rem", borderRadius: "8px", border: "1px solid #BFDBFE" }}>
                {bookingRef}
              </span>
              <span style={{ ...styles.statusBadge, color: sc.color, background: sc.bg, borderColor: sc.border }}>
                <StatusIcon size={13} color={sc.color} />
                <span>{sc.label}</span>
              </span>
            </div>
            <h2 id="modal-booking-title" style={{ fontSize: "1.45rem", fontWeight: 800, color: "#0F172A" }}>
              Booking Details
            </h2>
          </div>

          <button onClick={onClose} style={styles.closeBtn} aria-label="Close details modal">
            <X size={18} color="#64748B" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={styles.modalBody}>
          
          {/* ── Status Progression Timeline ── */}
          <div style={styles.timelineCard}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1E293B", marginBottom: "1rem" }}>
              Service Status Progression
            </div>
            <div style={styles.timelineSteps}>
              {[
                { step: 1, label: "Requested" },
                { step: 2, label: "Accepted" },
                { step: 3, label: "En Route" },
                { step: 4, label: "Completed" },
              ].map((s, idx) => {
                const isPassed = currentStep >= s.step;
                const isCurrent = currentStep === s.step;
                return (
                  <div key={idx} style={styles.stepItem}>
                    <div style={{
                      ...styles.stepNode,
                      background: isPassed ? (booking.status === "rejected" ? "#EF4444" : "#10B981") : "#E2E8F0",
                      color: isPassed ? "white" : "#64748B",
                      border: isCurrent ? "3px solid #BFDBFE" : "none"
                    }}>
                      {isPassed ? <Check size={14} color="white" /> : s.step}
                    </div>
                    <div style={{ fontSize: "0.74rem", fontWeight: isCurrent ? 700 : 500, color: isPassed ? "#0F172A" : "#94A3B8", marginTop: "0.3rem" }}>
                      {s.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Professional / Customer Summary ── */}
          <div style={styles.partnerCard}>
            <div style={styles.partnerAvatar}>
              {partnerName.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {isWorker ? "Client Information" : "Assigned Professional"}
              </div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0F172A", margin: "0.15rem 0" }}>
                {partnerName}
              </h3>
              <div style={{ fontSize: "0.84rem", color: "#64748B", display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                <span>{partnerRole}</span>
                {partnerPhone && (
                  <>
                    <span>&bull;</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                      <Phone size={13} color="#64748B" />
                      <span>{partnerPhone}</span>
                    </span>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={handleOpenChat}
              style={styles.chatActionBtn}
              title="Open real-time chat with this person"
            >
              <MessageCircle size={16} />
              <span>Chat Now</span>
            </button>
          </div>

          {/* ── Appointment Information Grid ── */}
          <div style={styles.infoGrid}>
            
            <div style={styles.infoTile}>
              <div style={styles.tileLabel}>
                <CalendarDays size={13} style={{ marginRight: "0.3rem" }} />
                <span>Date & Time Slot</span>
              </div>
              <div style={styles.tileValue}>{booking.date}</div>
              <div style={{ fontSize: "0.82rem", color: "#2563EB", fontWeight: 600, marginTop: "0.2rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Clock3 size={13} />
                <span>{booking.time}</span>
              </div>
            </div>

            <div style={styles.infoTile}>
              <div style={styles.tileLabel}>
                <Wrench size={13} style={{ marginRight: "0.3rem" }} />
                <span>Requested Service</span>
              </div>
              <div style={styles.tileValue}>{booking.service || `${partnerRole} Service`}</div>
              <div style={{ fontSize: "0.82rem", color: "#059669", fontWeight: 600, marginTop: "0.2rem" }}>
                {booking.estimatedPrice ? `Estimated: ₹${booking.estimatedPrice}` : "Standard Rate"}
              </div>
            </div>

            <div style={{ ...styles.infoTile, gridColumn: "1 / -1" }}>
              <div style={styles.tileLabel}>
                <MapPin size={13} style={{ marginRight: "0.3rem" }} />
                <span>Service Delivery Address</span>
              </div>
              <div style={{ ...styles.tileValue, fontSize: "0.92rem", fontWeight: 500 }}>
                {booking.address || "Client location registered in system"}
              </div>
            </div>

            {booking.notes && (
              <div style={{ ...styles.infoTile, gridColumn: "1 / -1", background: "#FFFBEB", borderColor: "#FDE68A" }}>
                <div style={{ ...styles.tileLabel, color: "#92400E" }}>
                  <FileText size={13} style={{ marginRight: "0.3rem" }} />
                  <span>Client Special Instructions</span>
                </div>
                <div style={{ fontSize: "0.88rem", color: "#78350F", marginTop: "0.2rem" }}>
                  "{booking.notes}"
                </div>
              </div>
            )}

          </div>

        </div>

        {/* ── Bottom Action Controls ── */}
        <div style={styles.modalFooter}>
          {isWorker && booking.status === "pending" && (
            <div style={{ display: "flex", gap: "0.75rem", width: "100%" }}>
              <button
                onClick={() => {
                  onStatusUpdate(booking._id, "accepted");
                  onClose();
                }}
                style={styles.acceptBtn}
              >
                <Check size={15} style={{ marginRight: "0.3rem" }} />
                <span>Accept Booking</span>
              </button>
              <button
                onClick={() => {
                  onStatusUpdate(booking._id, "rejected");
                  onClose();
                }}
                style={styles.declineBtn}
              >
                <X size={15} style={{ marginRight: "0.3rem" }} />
                <span>Decline</span>
              </button>
            </div>
          )}

          {isWorker && booking.status === "accepted" && (
            <button
              onClick={() => {
                onStatusUpdate(booking._id, "completed");
                onClose();
              }}
              style={styles.completeBtn}
            >
              <CheckCircle2 size={16} style={{ marginRight: "0.35rem" }} />
              <span>Mark Job as Completed</span>
            </button>
          )}

          {!isWorker && booking.status === "pending" && (
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to cancel this booking request?")) {
                  onStatusUpdate(booking._id, "rejected");
                  onClose();
                }
              }}
              style={styles.cancelRequestBtn}
            >
              Cancel Booking Request
            </button>
          )}

          <button onClick={onClose} style={styles.secondaryCloseBtn}>
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

const styles = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 23, 42, 0.65)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "1rem",
  },
  modalContainer: {
    width: "100%",
    maxWidth: "640px",
    maxHeight: "90vh",
    background: "#FFFFFF",
    borderRadius: "20px",
    boxShadow: "0 25px 60px -12px rgba(0, 0, 0, 0.28)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    border: "1px solid #E2E8F0",
  },
  modalHeader: {
    padding: "1.5rem 1.75rem 1.25rem",
    borderBottom: "1px solid #E2E8F0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    background: "#F8FAFC",
  },
  statusBadge: {
    fontSize: "0.78rem",
    fontWeight: 700,
    padding: "0.2rem 0.65rem",
    borderRadius: "20px",
    border: "1px solid",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
  },
  closeBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "white",
    border: "1px solid #CBD5E1",
    color: "#64748B",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "0.95rem",
    transition: "all 0.15s ease",
  },
  modalBody: {
    padding: "1.5rem 1.75rem",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  timelineCard: {
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "14px",
    padding: "1.1rem",
  },
  timelineSteps: {
    display: "flex",
    justifyContent: "space-between",
    position: "relative",
  },
  stepItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    zIndex: 1,
  },
  stepNode: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "0.85rem",
    transition: "all 0.2s ease",
  },
  partnerCard: {
    background: "#FFFFFF",
    border: "1.5px solid #E2E8F0",
    borderRadius: "16px",
    padding: "1.25rem",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
  },
  partnerAvatar: {
    width: "52px",
    height: "52px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, var(--primary), #1E40AF)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "1.4rem",
    flexShrink: 0,
  },
  chatActionBtn: {
    background: "var(--primary, #2563EB)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "0.65rem 1.15rem",
    fontWeight: 700,
    fontSize: "0.88rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.45rem",
    boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
    transition: "all 0.2s ease",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.85rem",
  },
  infoTile: {
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "12px",
    padding: "0.9rem 1rem",
  },
  tileLabel: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "0.25rem",
    display: "flex",
    alignItems: "center",
  },
  tileValue: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "#0F172A",
  },
  modalFooter: {
    padding: "1.25rem 1.75rem",
    borderTop: "1px solid #E2E8F0",
    background: "#F8FAFC",
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.75rem",
  },
  acceptBtn: {
    flex: 1,
    background: "#10B981",
    color: "white",
    border: "none",
    borderRadius: "10px",
    padding: "0.75rem",
    fontWeight: 700,
    fontSize: "0.92rem",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  declineBtn: {
    flex: 1,
    background: "white",
    color: "#EF4444",
    border: "1.5px solid #FCA5A5",
    borderRadius: "10px",
    padding: "0.75rem",
    fontWeight: 700,
    fontSize: "0.92rem",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  completeBtn: {
    flex: 1,
    background: "var(--primary)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    padding: "0.75rem",
    fontWeight: 700,
    fontSize: "0.92rem",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelRequestBtn: {
    background: "white",
    color: "#EF4444",
    border: "1.5px solid #FCA5A5",
    borderRadius: "10px",
    padding: "0.75rem 1.25rem",
    fontWeight: 600,
    fontSize: "0.88rem",
    cursor: "pointer",
  },
  secondaryCloseBtn: {
    background: "white",
    color: "#475569",
    border: "1px solid #CBD5E1",
    borderRadius: "10px",
    padding: "0.75rem 1.5rem",
    fontWeight: 600,
    fontSize: "0.92rem",
    cursor: "pointer",
  }
};
