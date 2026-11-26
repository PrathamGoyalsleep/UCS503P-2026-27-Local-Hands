import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Clock3,
  CheckCircle2,
  CalendarDays,
  MapPin,
  MessageCircle,
  Check,
  X,
  XCircle,
  CreditCard,
  Star,
  Receipt,
  BadgeCheck,
  Wrench,
  Zap,
  Sparkles,
  Hammer,
  Paintbrush,
  Settings
} from "./icons";

const STATUS_DETAILS = {
  pending: {
    color: "#D97706",
    bg: "#FEF3C7",
    border: "#FDE68A",
    dot: "#D97706",
    label: "Pending Confirmation",
    step: 1,
    Icon: Clock3,
  },
  accepted: {
    color: "#1E4E8C",
    bg: "#EEF4FB",
    border: "#D5E1F0",
    dot: "#1E4E8C",
    label: "Accepted & Scheduled",
    step: 2,
    Icon: CheckCircle2,
  },
  completed: {
    color: "#059669",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    dot: "#059669",
    label: "Service Completed",
    step: 3,
    Icon: CheckCircle2,
  },
  rejected: {
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FECACA",
    dot: "#DC2626",
    label: "Declined",
    step: 0,
    Icon: XCircle,
  },
  paid: {
    color: "#0D9488",
    bg: "#F0FDFA",
    border: "#99F6E4",
    dot: "#0D9488",
    label: "Paid & Completed",
    step: 4,
    Icon: CheckCircle2,
  },
};

const getCategoryIcon = (service = "", category = "") => {
  const s = `${service} ${category}`.toLowerCase();
  if (s.includes("plumb")) return Wrench;
  if (s.includes("electr")) return Zap;
  if (s.includes("clean")) return Sparkles;
  if (s.includes("carpen")) return Hammer;
  if (s.includes("paint")) return Paintbrush;
  if (s.includes("ac") || s.includes("appliance")) return Settings;
  return Wrench;
};

export default function BookingDetailsModal({
  booking,
  user,
  onClose,
  onStatusUpdate,
  onOpenPayment,
  onOpenReview,
}) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!booking) return null;

  const isWorker = user?.role === "worker";
  const statusKey = booking.status || "pending";
  const sc = STATUS_DETAILS[statusKey] || STATUS_DETAILS.pending;
  const StatusIcon = sc.Icon;
  const CategoryIcon = getCategoryIcon(booking.service, booking.workerId?.category);

  const partnerName = isWorker
    ? booking.customerId?.name || "Customer"
    : booking.workerId?.userId?.name || "Service Professional";
  const partnerRole = isWorker
    ? "Customer"
    : booking.workerId?.category || "Professional";
  const partnerPhone = isWorker
    ? booking.customerId?.phone
    : booking.workerId?.phone;
  const partnerAvatar = !isWorker
    ? booking.workerId?.profileImage || booking.workerId?.userId?.profileImage
    : null;

  const bookingRef = `#SC-${booking._id ? booking._id.slice(-6).toUpperCase() : "REQ"}`;
  const chatActive = booking.status !== "rejected";

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleOpenChat = () => {
    onClose();
    navigate(`/chat/${booking._id}`);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-booking-title"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
        boxSizing: "border-box",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "600px",
          maxHeight: "90vh",
          background: "#FFFFFF",
          borderRadius: "20px",
          boxShadow: "0 25px 50px -12px rgba(20, 43, 85, 0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid #DCE6F5",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        {/* ── Modal Header ── */}
        <div
          style={{
            padding: "1.4rem 1.6rem 1.1rem",
            borderBottom: "1px solid #EDF2F7",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            background: "#F8FAFC",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.35rem",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#1E4E8C",
                  background: "#EEF4FB",
                  padding: "0.15rem 0.55rem",
                  borderRadius: "6px",
                  border: "1px solid #D5E1F0",
                  letterSpacing: "0.03em",
                }}
              >
                {bookingRef}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  padding: "0.2rem 0.65rem",
                  borderRadius: "20px",
                  border: `1px solid ${sc.border}`,
                  background: sc.bg,
                  color: sc.color,
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: sc.dot,
                  }}
                />
                <span>{booking.paymentStatus === "paid" ? "Paid" : sc.label}</span>
              </span>
            </div>
            <h2
              id="modal-booking-title"
              style={{
                fontSize: "1.35rem",
                fontWeight: 800,
                color: "#172554",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              {booking.service || partnerRole}
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Close details modal"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "#FFFFFF",
              border: "1px solid #DCE6F5",
              color: "#64748B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Modal Body (Scrollable) ── */}
        <div
          style={{
            padding: "1.5rem 1.6rem",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          {/* Status Progression Steps */}
          {booking.status !== "rejected" && (
            <div
              style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "14px",
                padding: "1rem 1.25rem",
              }}
            >
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "#64748B",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "0.85rem",
                }}
              >
                Service Progression
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  position: "relative",
                }}
              >
                {[
                  { step: 1, label: "Requested" },
                  { step: 2, label: "Accepted" },
                  { step: 3, label: "Completed" },
                  { step: 4, label: "Paid" },
                ].map((s, idx) => {
                  const currentStep = sc.step;
                  const isDone = currentStep >= s.step;
                  const isCurrent = currentStep === s.step;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        zIndex: 1,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: "0.82rem",
                          background: isDone ? "#1E4E8C" : "#E2E8F0",
                          color: isDone ? "#FFFFFF" : "#64748B",
                          boxShadow: isCurrent ? "0 0 0 3px #D5E1F0" : "none",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {isDone ? <Check size={14} color="#FFFFFF" /> : s.step}
                      </div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: isCurrent ? 700 : 500,
                          color: isDone ? "#172554" : "#94A3B8",
                          marginTop: "0.35rem",
                          textAlign: "center",
                        }}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Assigned Partner / Customer Card */}
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #DCE6F5",
              borderRadius: "14px",
              padding: "1rem 1.15rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              boxShadow: "0 2px 8px rgba(20, 43, 85, 0.03)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #EEF4FB, #DBEAFE)",
                  color: "#173E73",
                  fontSize: "1.1rem",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #D5E1F0",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {partnerAvatar ? (
                  <img
                    src={partnerAvatar}
                    alt={partnerName}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  partnerName.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div
                  style={{
                    fontSize: "0.98rem",
                    fontWeight: 700,
                    color: "#172554",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  <span>{partnerName}</span>
                  {!isWorker && <BadgeCheck size={15} color="#1E4E8C" />}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748B", marginTop: "0.15rem" }}>
                  {partnerRole}
                  {partnerPhone ? ` • ${partnerPhone}` : ""}
                </div>
              </div>
            </div>

            {chatActive && (
              <button
                onClick={handleOpenChat}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  background: "#EEF4FB",
                  color: "#1E4E8C",
                  border: "1px solid #D5E1F0",
                  padding: "0.5rem 0.95rem",
                  borderRadius: "10px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.16s ease",
                  whiteSpace: "nowrap",
                }}
              >
                <MessageCircle size={14} />
                <span>Message</span>
              </button>
            )}
          </div>

          {/* Booking Info Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                padding: "0.85rem 1rem",
              }}
            >
              <div
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: "#64748B",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: "0.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <CalendarDays size={13} color="#1E4E8C" />
                <span>Appointment Date</span>
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#172554" }}>
                {booking.date || "Date unassigned"}
              </div>
            </div>

            <div
              style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                padding: "0.85rem 1rem",
              }}
            >
              <div
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: "#64748B",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: "0.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <Clock3 size={13} color="#1E4E8C" />
                <span>Service Time Slot</span>
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#172554" }}>
                {booking.time || "Time not specified"}
              </div>
            </div>

            <div
              style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                padding: "0.85rem 1rem",
                gridColumn: "span 2",
              }}
            >
              <div
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: "#64748B",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: "0.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <MapPin size={13} color="#1E4E8C" />
                <span>Service Address / Location</span>
              </div>
              <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "#172554" }}>
                {booking.address || booking.location || "Patiala, Punjab"}
              </div>
            </div>
          </div>

          {/* Pricing & Payment Status Summary */}
          <div
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "14px",
              padding: "1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "#64748B",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Estimated Total Amount
              </div>
              <div
                style={{
                  fontSize: "1.45rem",
                  fontWeight: 800,
                  color: "#172554",
                  marginTop: "0.15rem",
                }}
              >
                ₹{booking.estimatedPrice || 500}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "#64748B",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: "0.25rem",
                }}
              >
                Payment Status
              </div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.25rem 0.65rem",
                  borderRadius: "20px",
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  background: booking.paymentStatus === "paid" ? "#F0FDFA" : "#FFFBEB",
                  color: booking.paymentStatus === "paid" ? "#0D9488" : "#D97706",
                  border: `1px solid ${booking.paymentStatus === "paid" ? "#99F6E4" : "#FDE68A"}`,
                }}
              >
                {booking.paymentStatus === "paid" ? "Paid via Razorpay" : "Pending Payment"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Modal Footer: Action Controls ── */}
        <div
          style={{
            padding: "1.1rem 1.6rem",
            borderTop: "1px solid #EDF2F7",
            background: "#F8FAFC",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "0.65rem",
            flexWrap: "wrap",
          }}
        >
          {/* Worker Actions */}
          {isWorker && booking.status === "pending" && (
            <>
              <button
                onClick={() => {
                  onStatusUpdate(booking._id, "accepted");
                  onClose();
                }}
                style={{
                  background: "#059669",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "10px",
                  padding: "0.6rem 1.15rem",
                  fontWeight: 700,
                  fontSize: "0.86rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <Check size={14} />
                <span>Accept Booking</span>
              </button>
              <button
                onClick={() => {
                  onStatusUpdate(booking._id, "rejected");
                  onClose();
                }}
                style={{
                  background: "#FEF2F2",
                  color: "#DC2626",
                  border: "1px solid #FECACA",
                  borderRadius: "10px",
                  padding: "0.6rem 1.15rem",
                  fontWeight: 700,
                  fontSize: "0.86rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <X size={14} />
                <span>Decline</span>
              </button>
            </>
          )}

          {isWorker && booking.status === "accepted" && (
            <button
              onClick={() => {
                onStatusUpdate(booking._id, "completed");
                onClose();
              }}
              style={{
                background: "#059669",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "10px",
                padding: "0.6rem 1.25rem",
                fontWeight: 700,
                fontSize: "0.86rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <CheckCircle2 size={14} />
              <span>Mark Service Completed</span>
            </button>
          )}

          {/* Customer Pay / Receipt in Modal */}
          {!isWorker && ["accepted", "completed"].includes(booking.status) && (
            booking.paymentStatus === "paid" ? (
              <button
                onClick={() => {
                  onClose();
                  if (onOpenPayment) onOpenPayment(booking);
                }}
                style={{
                  background: "#F0FDFA",
                  color: "#0D9488",
                  border: "1px solid #99F6E4",
                  borderRadius: "10px",
                  padding: "0.6rem 1.15rem",
                  fontWeight: 700,
                  fontSize: "0.86rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <Receipt size={14} />
                <span>View Receipt</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  if (onOpenPayment) onOpenPayment(booking);
                }}
                style={{
                  background: "#0D9488",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "10px",
                  padding: "0.6rem 1.15rem",
                  fontWeight: 700,
                  fontSize: "0.86rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <CreditCard size={14} />
                <span>Pay ₹{booking.estimatedPrice || 500}</span>
              </button>
            )
          )}

          {/* Customer Review in Modal */}
          {!isWorker && booking.status === "completed" && (
            <button
              onClick={() => {
                onClose();
                if (onOpenReview) onOpenReview(booking);
              }}
              style={{
                background: "#FFFBEB",
                color: "#D97706",
                border: "1px solid #FDE68A",
                borderRadius: "10px",
                padding: "0.6rem 1.15rem",
                fontWeight: 700,
                fontSize: "0.86rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <Star size={14} fill="#D97706" />
              <span>Leave Review</span>
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              background: "#FFFFFF",
              color: "#64748B",
              border: "1px solid #DCE6F5",
              borderRadius: "10px",
              padding: "0.6rem 1.2rem",
              fontWeight: 600,
              fontSize: "0.86rem",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
