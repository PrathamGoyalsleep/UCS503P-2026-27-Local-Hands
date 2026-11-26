import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getMyBookings, updateBookingStatus } from "../services/bookingService";
import BookingDetailsModal from "../components/BookingDetailsModal";
import PaymentModal from "../components/PaymentModal";
import ReviewModal from "../components/ReviewModal";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  CalendarDays,
  Clock3,
  CheckCircle2,
  MessageCircle,
  MapPin,
  Wrench,
  Zap,
  Sparkles,
  Hammer,
  Paintbrush,
  Settings,
  Check,
  X,
  CreditCard,
  Star,
  Receipt,
  ArrowRight,
  BadgeCheck,
  ShieldCheck,
  CalendarCheck,
  Plus
} from "../components/icons";
import "./Bookings.css";

const STATUS_CONFIG = {
  pending: {
    color: "#B45309",
    bg: "#FEF3C7",
    border: "#FDE68A",
    dot: "#D97706",
    label: "Pending",
    accent: "#D97706",
  },
  accepted: {
    color: "#1D4ED8",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    dot: "#2563EB",
    label: "Accepted",
    accent: "#2563EB",
  },
  rejected: {
    color: "#B91C1C",
    bg: "#FEF2F2",
    border: "#FECACA",
    dot: "#DC2626",
    label: "Declined",
    accent: "#DC2626",
  },
  completed: {
    color: "#047857",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    dot: "#059669",
    label: "Completed",
    accent: "#059669",
  },
  paid: {
    color: "#0F766E",
    bg: "#F0FDFA",
    border: "#99F6E4",
    dot: "#0D9488",
    label: "Paid",
    accent: "#0D9488",
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

const getCategoryStyle = (service = "", category = "") => {
  const s = `${service} ${category}`.toLowerCase();
  if (s.includes("plumb")) return { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" };
  if (s.includes("electr")) return { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" };
  if (s.includes("clean")) return { bg: "#F3E8FF", color: "#7E22CE", border: "#E9D5FF" };
  if (s.includes("carpen")) return { bg: "#FFF7ED", color: "#C2410C", border: "#FFEDD5" };
  if (s.includes("paint")) return { bg: "#FDF2F8", color: "#BE185D", border: "#FBCFE8" };
  if (s.includes("ac") || s.includes("appliance")) return { bg: "#F0FDFA", color: "#0F766E", border: "#CCFBF1" };
  return { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" };
};

export default function Bookings() {
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedBookingForModal, setSelectedBookingForModal] = useState(null);
  const [paymentBooking, setPaymentBooking] = useState(null);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchBookings = async () => {
    try {
      const data = await getMyBookings(token);
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [token, user]);

  const handleStatusUpdate = async (id, status, customMessage) => {
    try {
      await updateBookingStatus(token, id, status);
      showToast(customMessage || `Booking updated to ${status}.`, "success");
      fetchBookings();
    } catch (err) {
      showToast(err.message || "Failed to update booking status.", "error");
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    try {
      await updateBookingStatus(token, cancelTarget._id, "rejected");
      showToast("Booking request cancelled successfully.", "success");
      setCancelTarget(null);
      fetchBookings();
    } catch (err) {
      showToast(err.message || "Failed to cancel booking.", "error");
    } finally {
      setCancelLoading(false);
    }
  };

  // Filtered list
  const filteredBookings =
    filter === "all"
      ? bookings
      : filter === "paid"
      ? bookings.filter((b) => b.status === "paid" || b.paymentStatus === "paid")
      : bookings.filter((b) => b.status === filter);

  // Dynamic Metrics
  const totalCount = bookings.length;
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const acceptedCount = bookings.filter((b) => b.status === "accepted").length;
  const completedCount = bookings.filter((b) => b.status === "completed").length;
  const paidCount = bookings.filter((b) => b.status === "paid" || b.paymentStatus === "paid").length;
  const declinedCount = bookings.filter((b) => b.status === "rejected").length;

  const verifiedEarnings = bookings
    .filter((b) => b.paymentStatus === "paid" || b.status === "paid")
    .reduce((sum, b) => sum + (Number(b.estimatedPrice) || 0), 0);

  // Filter Tabs definition
  const tabs = [
    { id: "all", label: "All Bookings", count: totalCount, dot: "#64748B" },
    { id: "pending", label: "Pending", count: pendingCount, dot: "#D97706" },
    { id: "accepted", label: "Accepted", count: acceptedCount, dot: "#2563EB" },
    { id: "completed", label: "Completed", count: completedCount, dot: "#059669" },
    { id: "paid", label: "Paid", count: paidCount, dot: "#0D9488" },
    { id: "rejected", label: "Declined", count: declinedCount, dot: "#DC2626" },
  ];

  return (
    <div className="bookings-page-wrapper">
      {/* ── 1. Page Header (Blue Gradient with decorative accents) ── */}
      <header className="bookings-hero-header">
        <div className="bookings-hero-inner">
          <div>
            <div className="bookings-hero-kicker">
              <ShieldCheck size={14} />
              <span>{user?.role === "worker" ? "Partner Service Hub" : "Customer Portal"}</span>
            </div>
            <h1 className="bookings-hero-title">My Bookings</h1>
            <p className="bookings-hero-desc">
              {user?.role === "worker"
                ? "Manage incoming service requests, coordinate customer visits, and track earnings seamlessly."
                : "Track scheduled appointments, message verified professionals, and manage secure doorstep payments."}
            </p>
          </div>

          {user?.role !== "worker" && (
            <Link to="/search" className="bookings-hero-cta">
              <Plus size={16} />
              <span>Book New Service</span>
            </Link>
          )}
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="bookings-main-container">
        {/* ── 2. Booking Statistics (5 Individual Rectangular Cards) ── */}
        <section className="bookings-stats-grid" aria-label="Booking Statistics">
          {/* Total Bookings Card */}
          <div className="bookings-stat-card">
            <div
              className="bookings-stat-icon"
              style={{ background: "#EFF6FF", color: "#2563EB" }}
            >
              <CalendarDays size={22} />
            </div>
            <div>
              <div className="bookings-stat-value">{totalCount}</div>
              <div className="bookings-stat-label">Total Bookings</div>
            </div>
          </div>

          {/* Pending Card */}
          <div className="bookings-stat-card">
            <div
              className="bookings-stat-icon"
              style={{ background: "#FEF3C7", color: "#D97706" }}
            >
              <Clock3 size={22} />
            </div>
            <div>
              <div className="bookings-stat-value">{pendingCount}</div>
              <div className="bookings-stat-label">Pending Confirmation</div>
            </div>
          </div>

          {/* Accepted Card */}
          <div className="bookings-stat-card">
            <div
              className="bookings-stat-icon"
              style={{ background: "#DBEAFE", color: "#1D4ED8" }}
            >
              <CheckCircle2 size={22} />
            </div>
            <div>
              <div className="bookings-stat-value">{acceptedCount}</div>
              <div className="bookings-stat-label">Accepted Jobs</div>
            </div>
          </div>

          {/* Completed Card */}
          <div className="bookings-stat-card">
            <div
              className="bookings-stat-icon"
              style={{ background: "#D1FAE5", color: "#059669" }}
            >
              <Check size={22} />
            </div>
            <div>
              <div className="bookings-stat-value">{completedCount}</div>
              <div className="bookings-stat-label">Completed Services</div>
            </div>
          </div>

          {/* Paid / Earnings Card */}
          <div className="bookings-stat-card">
            <div
              className="bookings-stat-icon"
              style={{ background: "#CCFBF1", color: "#0D9488" }}
            >
              {user?.role === "worker" ? <Receipt size={22} /> : <CreditCard size={22} />}
            </div>
            <div>
              <div className="bookings-stat-value">
                {user?.role === "worker"
                  ? `₹${verifiedEarnings.toLocaleString("en-IN")}`
                  : paidCount}
              </div>
              <div className="bookings-stat-label">
                {user?.role === "worker" ? "Verified Earnings" : "Paid Services"}
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. Booking Filter Tabs ── */}
        <nav className="bookings-tabs-wrapper" aria-label="Filter bookings by status">
          {tabs.map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`bookings-tab-pill ${isActive ? "active" : ""}`}
              >
                <span
                  className="bookings-tab-dot"
                  style={{ background: tab.dot }}
                />
                <span>{tab.label}</span>
                <span className="bookings-tab-badge">{tab.count}</span>
              </button>
            );
          })}
        </nav>

        {/* ── 4. Booking Cards Grid / Skeletons / Empty State ── */}
        {loading ? (
          <div className="bookings-card-grid">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="sc-booking-skeleton">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: "0.85rem", alignItems: "center" }}>
                    <div className="sc-skeleton-pulse" style={{ width: "44px", height: "44px", borderRadius: "12px" }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <div className="sc-skeleton-pulse" style={{ width: "160px", height: "16px" }} />
                      <div className="sc-skeleton-pulse" style={{ width: "90px", height: "12px" }} />
                    </div>
                  </div>
                  <div className="sc-skeleton-pulse" style={{ width: "80px", height: "26px", borderRadius: "20px" }} />
                </div>
                <div className="sc-skeleton-pulse" style={{ height: "48px", borderRadius: "10px" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                  <div className="sc-skeleton-pulse" style={{ width: "100px", height: "24px" }} />
                  <div className="sc-skeleton-pulse" style={{ width: "140px", height: "36px", borderRadius: "10px" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bookings-empty-card">
            <div className="bookings-empty-icon-box">
              <CalendarCheck size={36} />
            </div>
            <h3 className="bookings-empty-title">No bookings found</h3>
            <p className="bookings-empty-text">
              {filter === "all"
                ? "You don't have any bookings in this view. Browse available verified professionals to schedule your first service."
                : `You currently have no ${filter} bookings in this section.`}
            </p>
            {user?.role !== "worker" && filter === "all" && (
              <Link to="/search" className="sc-btn sc-btn-primary" style={{ padding: "0.7rem 1.6rem" }}>
                <span>Explore Services</span>
                <ArrowRight size={15} />
              </Link>
            )}
          </div>
        ) : (
          <div className="bookings-card-grid">
            {filteredBookings.map((booking) => {
              const isWorker = user?.role === "worker";
              const rawStatus = booking.status || "pending";
              const isPaid = booking.paymentStatus === "paid" || rawStatus === "paid";
              const sc = STATUS_CONFIG[rawStatus] || STATUS_CONFIG.pending;
              
              const partnerName = isWorker
                ? booking.customerId?.name || "Customer Client"
                : booking.workerId?.userId?.name || "ServeConnect Specialist";
              const partnerCategory = isWorker
                ? "Customer"
                : booking.workerId?.category || "Professional";
              const partnerAvatar = !isWorker
                ? booking.workerId?.profileImage || booking.workerId?.userId?.profileImage
                : null;
              
              const serviceName = booking.service || partnerCategory || "Home Service";
              const bookingPrice = booking.estimatedPrice !== undefined && booking.estimatedPrice !== null && booking.estimatedPrice !== ""
                ? `₹${Number(booking.estimatedPrice).toLocaleString("en-IN")}`
                : "Price unavailable";
              const bookingRef = `#SC-${booking._id ? booking._id.slice(-6).toUpperCase() : "REQ"}`;
              const chatActive = booking.status !== "rejected";

              const CategoryIcon = getCategoryIcon(booking.service, booking.workerId?.category);
              const catStyle = getCategoryStyle(booking.service, booking.workerId?.category);

              return (
                <article
                  key={booking._id}
                  className="sc-booking-card"
                  style={{ "--card-accent": sc.accent }}
                  onClick={() => setSelectedBookingForModal(booking)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedBookingForModal(booking);
                    }
                  }}
                >
                  {/* ── Card Top Section ── */}
                  <div className="sc-card-top">
                    <div className="sc-card-service-info">
                      <div
                        className="sc-card-category-icon"
                        style={{
                          background: catStyle.bg,
                          color: catStyle.color,
                          borderColor: catStyle.border,
                        }}
                      >
                        <CategoryIcon size={20} />
                      </div>
                      <div className="sc-card-title-group">
                        <h2 className="sc-card-service-title">{serviceName}</h2>
                        <span className="sc-card-ref-badge">{bookingRef}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div
                      className="sc-status-pill"
                      style={{
                        background: sc.bg,
                        color: sc.color,
                        borderColor: sc.border,
                      }}
                    >
                      <span
                        className="sc-status-dot"
                        style={{ background: sc.dot }}
                      />
                      <span>{isPaid ? "Paid" : sc.label}</span>
                    </div>
                  </div>

                  {/* ── Card Middle Section ── */}
                  <div className="sc-card-middle">
                    <div className="sc-card-divider" />
                    
                    {/* Assigned Partner Row */}
                    <div className="sc-card-partner-row">
                      <div className="sc-card-avatar">
                        {partnerAvatar ? (
                          <img src={partnerAvatar} alt={partnerName} />
                        ) : (
                          partnerName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="sc-card-partner-details">
                        <div className="sc-card-partner-name">
                          <span>{partnerName}</span>
                          {!isWorker && <BadgeCheck size={14} color="#2563EB" />}
                        </div>
                        <div className="sc-card-partner-role">{partnerCategory}</div>
                      </div>
                    </div>

                    {/* Info Grid: Date, Time, Location */}
                    <div className="sc-card-info-grid">
                      <div className="sc-card-info-item">
                        <span className="sc-card-info-label">
                          <CalendarDays size={12} color="#2563EB" />
                          <span>Date</span>
                        </span>
                        <span className="sc-card-info-value">
                          {booking.date || "Unassigned"}
                        </span>
                      </div>

                      <div className="sc-card-info-item">
                        <span className="sc-card-info-label">
                          <Clock3 size={12} color="#2563EB" />
                          <span>Time</span>
                        </span>
                        <span className="sc-card-info-value">
                          {booking.time || "Flexible"}
                        </span>
                      </div>

                      <div className="sc-card-info-item">
                        <span className="sc-card-info-label">
                          <MapPin size={12} color="#2563EB" />
                          <span>Location</span>
                        </span>
                        <span
                          className="sc-card-info-value"
                          title={booking.address || booking.location || "Patiala"}
                        >
                          {booking.address || booking.location || "Patiala"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── Card Bottom Section ── */}
                  <div className="sc-card-bottom" onClick={(e) => e.stopPropagation()}>
                    <div className="sc-card-price-group">
                      <span className="sc-card-price-label">Service Total</span>
                      <span className="sc-card-price-value">
                        {bookingPrice}
                      </span>
                      <span
                        className="sc-card-payment-badge"
                        style={{
                          color: isPaid ? "#0D9488" : "#D97706",
                        }}
                      >
                        {isPaid ? (
                          <>
                            <CheckCircle2 size={12} color="#0D9488" />
                            <span>Paid</span>
                          </>
                        ) : (
                          <>
                            <Clock3 size={12} color="#D97706" />
                            <span>Payment Pending</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="sc-card-actions">
                      {/* Worker Accept/Decline */}
                      {isWorker && booking.status === "pending" && (
                        <>
                          <button
                            type="button"
                            className="sc-btn sc-btn-accept"
                            onClick={() => handleStatusUpdate(booking._id, "accepted")}
                          >
                            <Check size={13} />
                            <span>Accept</span>
                          </button>
                          <button
                            type="button"
                            className="sc-btn sc-btn-danger"
                            onClick={() => handleStatusUpdate(booking._id, "rejected")}
                          >
                            <X size={13} />
                            <span>Decline</span>
                          </button>
                        </>
                      )}

                      {/* Worker Complete */}
                      {isWorker && booking.status === "accepted" && (
                        <button
                          type="button"
                          className="sc-btn sc-btn-accept"
                          onClick={() => handleStatusUpdate(booking._id, "completed")}
                        >
                          <CheckCircle2 size={13} />
                          <span>Complete</span>
                        </button>
                      )}

                      {/* Customer Cancel Pending */}
                      {!isWorker && booking.status === "pending" && (
                        <button
                          type="button"
                          className="sc-btn sc-btn-danger"
                          onClick={() => setCancelTarget(booking)}
                        >
                          <X size={13} />
                          <span>Cancel</span>
                        </button>
                      )}

                      {/* Customer Pay / Receipt */}
                      {!isWorker && ["accepted", "completed"].includes(booking.status) && (
                        isPaid ? (
                          <button
                            type="button"
                            className="sc-btn sc-btn-receipt"
                            onClick={() => setPaymentBooking(booking)}
                          >
                            <Receipt size={13} />
                            <span>Receipt</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="sc-btn sc-btn-pay"
                            onClick={() => setPaymentBooking(booking)}
                          >
                            <CreditCard size={13} />
                            <span>Pay {bookingPrice}</span>
                          </button>
                        )
                      )}

                      {/* Customer Review (Only on completed) */}
                      {!isWorker && booking.status === "completed" && (
                        <button
                          type="button"
                          className="sc-btn sc-btn-review"
                          onClick={() => setReviewBooking(booking)}
                        >
                          <Star size={13} fill="#D97706" />
                          <span>Review</span>
                        </button>
                      )}

                      {/* Chat Button */}
                      <button
                        type="button"
                        className="sc-btn sc-btn-chat"
                        disabled={!chatActive}
                        onClick={() => {
                          if (chatActive) navigate(`/chat/${booking._id}`);
                        }}
                      >
                        <MessageCircle size={13} />
                        <span>Chat</span>
                      </button>

                      {/* View Details */}
                      <button
                        type="button"
                        className="sc-btn sc-btn-outline"
                        onClick={() => setSelectedBookingForModal(booking)}
                      >
                        <span>Details</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Modals & Dialogs (Preserved Exactly) ── */}
      {selectedBookingForModal && (
        <BookingDetailsModal
          booking={selectedBookingForModal}
          user={user}
          onClose={() => setSelectedBookingForModal(null)}
          onStatusUpdate={handleStatusUpdate}
          onOpenPayment={(b) => setPaymentBooking(b)}
          onOpenReview={(b) => setReviewBooking(b)}
        />
      )}

      {paymentBooking && (
        <PaymentModal
          booking={paymentBooking}
          onClose={() => setPaymentBooking(null)}
          onPaymentSuccess={() => {
            fetchBookings();
            setPaymentBooking(null);
          }}
        />
      )}

      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onReviewSuccess={() => {
            fetchBookings();
            setReviewBooking(null);
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        isOpen={Boolean(cancelTarget)}
        title="Cancel Booking Request?"
        message={`Are you sure you want to cancel your booking request for ${
          cancelTarget?.service || "this service"
        } on ${cancelTarget?.date || "the selected date"}?`}
        confirmLabel="Yes, Cancel Booking"
        cancelLabel="Keep Booking"
        danger={true}
        variant="danger"
        loading={cancelLoading}
        onConfirm={handleConfirmCancel}
        onCancel={() => !cancelLoading && setCancelTarget(null)}
      />
    </div>
  );
}
