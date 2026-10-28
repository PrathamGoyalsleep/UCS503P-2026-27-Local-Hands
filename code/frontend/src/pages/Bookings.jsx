import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyBookings, updateBookingStatus } from "../services/bookingService";
import { Link, useNavigate } from "react-router-dom";
import BookingDetailsModal from "../components/BookingDetailsModal";
import {
  CalendarDays,
  CalendarCheck,
  Clock,
  Clock3,
  CheckCircle2,
  XCircle,
  Award,
  ArrowRight,
  MessageCircle,
  MapPin,
  Wrench,
  Check,
  X,
  FileText
} from "lucide-react";

const statusConfig = {
  pending:   { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", dot: "#D97706", label: "Pending Confirmation", Icon: Clock },
  accepted:  { color: "#059669", bg: "#F0FDF4", border: "#A7F3D0", dot: "#059669", label: "Accepted & Confirmed", Icon: CheckCircle2 },
  rejected:  { color: "#DC2626", bg: "#FFF1F2", border: "#FECACA", dot: "#DC2626", label: "Declined", Icon: XCircle },
  completed: { color: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE", dot: "#4F46E5", label: "Service Completed", Icon: CheckCircle2 },
  paid:      { color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", dot: "#7C3AED", label: "Paid", Icon: CheckCircle2 },
};

function BookingSkeleton() {
  return (
    <div style={{ background: "white", borderRadius: "18px", border: "1.5px solid #E2E8F0", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ width: "120px", height: "20px", background: "#E2E8F0", borderRadius: "6px", animation: "shimmer 1.5s infinite" }} />
        <div style={{ width: "80px", height: "20px", background: "#E2E8F0", borderRadius: "12px", animation: "shimmer 1.5s infinite" }} />
      </div>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <div style={{ width: "50px", height: "50px", borderRadius: "14px", background: "#E2E8F0", animation: "shimmer 1.5s infinite" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ width: "40%", height: "16px", background: "#E2E8F0", borderRadius: "4px" }} />
          <div style={{ width: "60%", height: "14px", background: "#E2E8F0", borderRadius: "4px" }} />
        </div>
      </div>
    </div>
  );
}

export default function Bookings() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedBookingForModal, setSelectedBookingForModal] = useState(null);
  const [hoveredBookingId, setHoveredBookingId] = useState(null);

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
  }, [token, user]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateBookingStatus(token, id, status);
      fetchBookings();
    } catch (err) {
      alert(err.message || "Failed to update booking status.");
    }
  };

  const filteredBookings = filter === "all" ? bookings : bookings.filter(b => b.status === filter);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", padding: "2.5rem 1rem 5rem" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>

        {/* ── Page Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
          <div>
            <div style={{ fontSize: "0.78rem", fontWeight: 800, letterSpacing: "1.2px", color: "var(--primary)", textTransform: "uppercase", marginBottom: "0.3rem" }}>
              {user?.role === "worker" ? "Partner Job Manager" : "Customer Service Records"}
            </div>
            <h1 style={{ fontSize: "2.2rem", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em" }}>
              {user?.role === "worker" ? "Incoming Job Requests" : "My Service Bookings"}
            </h1>
            <p style={{ color: "#64748B", fontSize: "0.95rem", marginTop: "0.25rem" }}>
              {user?.role === "worker"
                ? "Review appointment requests, coordinate with clients via live chat, and track job statuses."
                : "Track scheduled visits, communicate directly with your assigned professional, and manage service requests."}
            </p>
          </div>

          {user?.role === "customer" && (
            <Link
              to="/search"
              className="btn btn-primary"
              style={{ padding: "0.75rem 1.4rem", borderRadius: "12px", fontWeight: 700 }}
            >
              + Book New Service
            </Link>
          )}
        </div>

        {/* ── Key Metrics Bar ── */}
        <div style={styles.statsGrid}>
          {[
            { label: "Total Bookings", value: bookings.length, color: "#2563EB", Icon: CalendarCheck },
            { label: "Pending", value: bookings.filter(b => b.status === "pending").length, color: "#D97706", Icon: Clock },
            { label: "Confirmed / Active", value: bookings.filter(b => b.status === "accepted").length, color: "#059669", Icon: CheckCircle2 },
            { label: "Completed", value: bookings.filter(b => b.status === "completed").length, color: "#7C3AED", Icon: Award },
          ].map((stat, idx) => {
            const StatIcon = stat.Icon;
            return (
              <div key={idx} style={styles.statCard} className="hover-lift">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <StatIcon size={22} color={stat.color} />
                  <span style={{ fontSize: "1.9rem", fontWeight: 800, color: stat.color }}>{stat.value}</span>
                </div>
                <div style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: 600, marginTop: "0.4rem" }}>
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Filter Tabs ── */}
        <div style={styles.filterTabsRow}>
          {[
            { id: "all", label: "All Bookings" },
            { id: "pending", label: "Pending Review" },
            { id: "accepted", label: "Accepted / Active" },
            { id: "completed", label: "Completed" },
            { id: "rejected", label: "Declined" },
          ].map(f => {
            const isSelected = filter === f.id;
            const count = f.id === "all" ? bookings.length : bookings.filter(b => b.status === f.id).length;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                style={{
                  ...styles.filterBtn,
                  background: isSelected ? "var(--primary)" : "white",
                  color: isSelected ? "white" : "#475569",
                  borderColor: isSelected ? "var(--primary)" : "#E2E8F0",
                  fontWeight: isSelected ? 700 : 500,
                  boxShadow: isSelected ? "0 4px 12px rgba(37,99,235,0.25)" : "none"
                }}
              >
                <span>{f.label}</span>
                <span style={{
                  ...styles.badgeCount,
                  background: isSelected ? "rgba(255,255,255,0.25)" : "#F1F5F9",
                  color: isSelected ? "white" : "#64748B"
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Bookings Cards List ── */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <BookingSkeleton />
            <BookingSkeleton />
            <BookingSkeleton />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div style={styles.emptyCard}>
            <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
              <FileText size={48} color="#94A3B8" />
            </div>
            <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0F172A", marginBottom: "0.5rem" }}>
              No bookings found
            </h3>
            <p style={{ color: "#64748B", maxWidth: "420px", margin: "0 auto 1.5rem", fontSize: "0.92rem", lineHeight: 1.5 }}>
              {filter === "all"
                ? "You do not have any active appointments. Find a verified professional and book your first service in seconds."
                : `You currently have no ${filter} bookings.`}
            </p>
            {user?.role === "customer" && filter === "all" && (
              <Link to="/search" className="btn btn-primary" style={{ padding: "0.75rem 1.75rem", borderRadius: "12px", fontWeight: 700 }}>
                Explore Verified Services
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
            {filteredBookings.map((booking) => {
              const sc = statusConfig[booking.status] || statusConfig.pending;
              const StatusIcon = sc.Icon;
              const isHovered = hoveredBookingId === booking._id;
              const isWorker = user?.role === "worker";
              const partnerName = isWorker
                ? (booking.customerId?.name || "Client")
                : (booking.workerId?.userId?.name || "Service Partner");
              const partnerTrade = isWorker ? "Customer" : (booking.workerId?.category || "Professional");
              const bookingRef = `#SC-${booking._id ? booking._id.slice(-6).toUpperCase() : "REQ"}`;
              const chatActive = booking.status !== "rejected";

              return (
                <div
                  key={booking._id}
                  onClick={() => setSelectedBookingForModal(booking)}
                  onMouseEnter={() => setHoveredBookingId(booking._id)}
                  onMouseLeave={() => setHoveredBookingId(null)}
                  style={{
                    ...styles.bookingCard,
                    borderColor: isHovered ? "var(--primary)" : "#E2E8F0",
                    boxShadow: isHovered
                      ? "0 12px 28px -6px rgba(37,99,235,0.14), 0 4px 10px rgba(0,0,0,0.04)"
                      : "0 2px 6px rgba(0,0,0,0.03)",
                    transform: isHovered ? "translateY(-3px)" : "none",
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open details for booking ${bookingRef}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedBookingForModal(booking);
                    }
                  }}
                >
                  {/* Top Status Accent Bar */}
                  <div style={{ height: "4px", background: sc.color }} />

                  <div style={{ padding: "1.4rem 1.75rem" }}>
                    
                    {/* Top Row: Booking ID, Status Badge & Arrow */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <span style={styles.bookingIdBadge}>
                          {bookingRef}
                        </span>
                        <span style={{ ...styles.statusTag, color: sc.color, background: sc.bg, borderColor: sc.border }}>
                          <StatusIcon size={13} color={sc.color} />
                          <span>{sc.label}</span>
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: isHovered ? "var(--primary)" : "#94A3B8", fontSize: "0.85rem", fontWeight: 600 }}>
                        <span>View Details</span>
                        <ArrowRight
                          size={16}
                          style={{
                            transform: isHovered ? "translateX(4px)" : "translateX(0)",
                            transition: "transform 0.2s ease"
                          }}
                        />
                      </div>
                    </div>

                    {/* Middle Row: Partner Info, Schedule, Address & Pricing */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.25rem" }}>
                      
                      {/* Left: Avatar & Partner Identity */}
                      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", flex: 1, minWidth: "260px" }}>
                        <div style={styles.partnerAvatar}>
                          {partnerName.charAt(0)}
                        </div>

                        <div style={{ flex: 1 }}>
                          <h3 style={styles.partnerNameHeading}>
                            {partnerName}
                          </h3>
                          <div style={{ fontSize: "0.84rem", color: "#64748B", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                            <span>{partnerTrade}</span>
                            <span>&bull;</span>
                            <span style={{ color: "#2563EB", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                              <CalendarDays size={13} color="#2563EB" />
                              <span>{booking.date}</span>
                              <Clock3 size={13} color="#2563EB" style={{ marginLeft: "0.25rem" }} />
                              <span>{booking.time}</span>
                            </span>
                          </div>

                          {/* Specific Service / Price */}
                          {booking.service && (
                            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1E293B", marginTop: "0.35rem", display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                                <Wrench size={14} color="#64748B" />
                                <span>{booking.service}</span>
                              </span>
                              {booking.estimatedPrice && (
                                <span style={styles.priceBadge}>
                                  ₹{booking.estimatedPrice} Est.
                                </span>
                              )}
                            </div>
                          )}

                          {/* Address Snippet */}
                          {booking.address && (
                            <div style={{ fontSize: "0.82rem", color: "#64748B", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                              <MapPin size={13} color="#94A3B8" />
                              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "420px" }}>
                                {booking.address}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Quick Action Buttons */}
                      <div
                        style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}
                        onClick={(e) => e.stopPropagation()} // Stop click from opening details modal
                      >
                        {/* Worker Accept/Decline */}
                        {isWorker && booking.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(booking._id, "accepted")}
                              style={styles.cardAcceptBtn}
                            >
                              <Check size={14} style={{ marginRight: "0.25rem" }} />
                              <span>Accept</span>
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(booking._id, "rejected")}
                              style={styles.cardDeclineBtn}
                            >
                              <X size={14} style={{ marginRight: "0.25rem" }} />
                              <span>Decline</span>
                            </button>
                          </>
                        )}

                        {/* Worker Mark Complete */}
                        {isWorker && booking.status === "accepted" && (
                          <button
                            onClick={() => handleStatusUpdate(booking._id, "completed")}
                            style={styles.cardCompleteBtn}
                          >
                            <CheckCircle2 size={14} style={{ marginRight: "0.25rem" }} />
                            <span>Mark Complete</span>
                          </button>
                        )}

                        {/* Interactive Chat Button */}
                        <button
                          onClick={() => {
                            if (chatActive) navigate(`/chat/${booking._id}`);
                          }}
                          disabled={!chatActive}
                          title={chatActive ? "Open real-time chat with this person" : "Chat unavailable for declined bookings"}
                          style={{
                            ...styles.cardChatBtn,
                            background: chatActive ? "#EFF6FF" : "#F1F5F9",
                            color: chatActive ? "#2563EB" : "#94A3B8",
                            borderColor: chatActive ? "#BFDBFE" : "#E2E8F0",
                            cursor: chatActive ? "pointer" : "not-allowed",
                          }}
                        >
                          <MessageCircle size={15} />
                          <span>Live Chat</span>
                        </button>
                      </div>

                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ── Booking Details Modal ── */}
      {selectedBookingForModal && (
        <BookingDetailsModal
          booking={selectedBookingForModal}
          user={user}
          onClose={() => setSelectedBookingForModal(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}

const styles = {
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1.25rem",
    marginBottom: "2rem",
  },
  statCard: {
    background: "white",
    borderRadius: "16px",
    padding: "1.25rem",
    border: "1.5px solid #E2E8F0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
  },
  filterTabsRow: {
    display: "flex",
    gap: "0.6rem",
    marginBottom: "1.75rem",
    overflowX: "auto",
    paddingBottom: "0.4rem",
  },
  filterBtn: {
    padding: "0.6rem 1.15rem",
    borderRadius: "30px",
    border: "1.5px solid",
    cursor: "pointer",
    fontSize: "0.88rem",
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
    gap: "0.45rem",
    transition: "all 0.2s ease",
  },
  badgeCount: {
    fontSize: "0.75rem",
    fontWeight: 700,
    padding: "0.15rem 0.5rem",
    borderRadius: "12px",
  },
  emptyCard: {
    background: "white",
    borderRadius: "20px",
    padding: "4.5rem 2rem",
    textAlign: "center",
    border: "1.5px solid #E2E8F0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
  },
  bookingCard: {
    background: "white",
    borderRadius: "18px",
    border: "1.5px solid #E2E8F0",
    overflow: "hidden",
    cursor: "pointer",
    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
    outline: "none",
  },
  bookingIdBadge: {
    fontSize: "0.75rem",
    fontWeight: 800,
    background: "#F1F5F9",
    color: "#334155",
    padding: "0.2rem 0.55rem",
    borderRadius: "6px",
    letterSpacing: "0.5px",
  },
  statusTag: {
    fontSize: "0.78rem",
    fontWeight: 700,
    padding: "0.2rem 0.65rem",
    borderRadius: "20px",
    border: "1px solid",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
  },
  partnerAvatar: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, var(--primary), #1E40AF)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: "1.2rem",
    flexShrink: 0,
    boxShadow: "0 2px 8px rgba(37,99,235,0.2)",
  },
  partnerNameHeading: {
    fontSize: "1.15rem",
    fontWeight: 800,
    color: "#0F172A",
    letterSpacing: "-0.01em",
    marginBottom: "0.15rem",
  },
  priceBadge: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#059669",
    background: "#ECFDF5",
    padding: "0.15rem 0.5rem",
    borderRadius: "12px",
    border: "1px solid #A7F3D0",
  },
  cardAcceptBtn: {
    background: "#10B981",
    color: "white",
    border: "none",
    borderRadius: "10px",
    padding: "0.6rem 1rem",
    fontWeight: 700,
    fontSize: "0.85rem",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
  },
  cardDeclineBtn: {
    background: "white",
    color: "#EF4444",
    border: "1.5px solid #FCA5A5",
    borderRadius: "10px",
    padding: "0.6rem 1rem",
    fontWeight: 700,
    fontSize: "0.85rem",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
  },
  cardCompleteBtn: {
    background: "var(--primary)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    padding: "0.6rem 1.15rem",
    fontWeight: 700,
    fontSize: "0.85rem",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
  },
  cardChatBtn: {
    borderRadius: "10px",
    border: "1.5px solid",
    padding: "0.6rem 1.15rem",
    fontWeight: 700,
    fontSize: "0.88rem",
    display: "flex",
    alignItems: "center",
    gap: "0.45rem",
    transition: "all 0.15s ease",
  }
};
