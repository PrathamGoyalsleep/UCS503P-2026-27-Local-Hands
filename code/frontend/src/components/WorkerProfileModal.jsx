import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createBooking } from "../services/bookingService";
import { getWorkerById } from "../services/workerService";
import { getWorkerReviews } from "../services/reviewService";
import { calculatePricing } from "../utils/pricingCalculator";
import {
  BadgeCheck,
  ShieldCheck,
  CheckCircle2,
  Check,
  X,
  Clock,
  Clock3,
  CalendarDays,
  CalendarCheck,
  Images,
  BriefcaseBusiness,
  MessageSquare,
  Star,
  MapPin,
  IndianRupee,
  AlertTriangle,
  FileText,
  ClipboardList,
  Zap,
  Wrench,
  Hammer,
  Paintbrush,
  Sparkles,
  Snowflake,
} from "lucide-react";

const categoryTheme = {
  Electrician: { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", label: "Electrician", Icon: Zap },
  Plumber:     { color: "#1E4E8C", bg: "#EEF4FB", border: "#CBDDF2", label: "Plumber", Icon: Wrench },
  Carpenter:   { color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", label: "Carpenter", Icon: Hammer },
  Painter:     { color: "#DB2777", bg: "#FDF2F8", border: "#FBCFE8", label: "Painter", Icon: Paintbrush },
  Cleaning:    { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", label: "Cleaning", Icon: Sparkles },
  "AC Repair": { color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC", label: "AC Repair", Icon: Snowflake },
};

const timeSlots = [
  "09:00 AM - 11:00 AM",
  "11:30 AM - 01:30 PM",
  "02:00 PM - 04:00 PM",
  "04:30 PM - 06:30 PM",
  "07:00 PM - 09:00 PM"
];

// Helpers for Asia/Kolkata date and slot expiration
function getKolkataDateString(d = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  const parts = formatter.formatToParts(d);
  const p = {};
  for (const part of parts) p[part.type] = part.value;
  return `${p.year}-${p.month}-${p.day}`;
}

function getKolkataTomorrowString() {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  return getKolkataDateString(now);
}

function parseSlotStartMinutes(slotStr) {
  if (!slotStr || typeof slotStr !== "string") return null;
  const parts = slotStr.split(/[-–]/);
  const target = parts[0].trim();
  const match = target.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const modifier = match[3] ? match[3].toUpperCase() : null;

  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

function parseSlotEndMinutes(slotStr) {
  if (!slotStr || typeof slotStr !== "string") return null;
  const parts = slotStr.split(/[-–]/);
  const target = parts.length > 1 ? parts[1].trim() : parts[0].trim();
  const match = target.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const modifier = match[3] ? match[3].toUpperCase() : null;

  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

function parseSlotDurationHours(slotStr) {
  if (!slotStr || typeof slotStr !== "string") return 2;
  const start = parseSlotStartMinutes(slotStr);
  const end = parseSlotEndMinutes(slotStr);
  if (start !== null && end !== null && end > start) {
    return Math.round(((end - start) / 60) * 10) / 10;
  }
  return 2;
}

function getKolkataCurrentMinutes() {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const parts = formatter.formatToParts(new Date());
  const p = {};
  for (const part of parts) p[part.type] = part.value;
  return parseInt(p.hour, 10) * 60 + parseInt(p.minute, 10);
}

function isSlotExpired(slotStr, selectedDate) {
  if (!selectedDate) return false;
  const todayStr = getKolkataDateString();
  if (selectedDate < todayStr) return true; // Past dates are always expired
  if (selectedDate > todayStr) return false; // Future date: all valid slots allowed

  // For today: If the slot's starting time has already passed or is currently elapsed, mark it unavailable.
  // Do not allow booking a partially elapsed slot!
  const slotStart = parseSlotStartMinutes(slotStr);
  if (slotStart === null) return false;
  const currentMinutes = getKolkataCurrentMinutes();
  return slotStart <= currentMinutes;
}

export default function WorkerProfileModal({ workerId, initialWorker, onClose, onBookingSuccess }) {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Section references for reliable tab navigation & scrolling
  const modalBodyRef = useRef(null);
  const overviewRef = useRef(null);
  const portfolioRef = useRef(null);
  const reviewsRef = useRef(null);
  const bookingRef = useRef(null);

  const [worker, setWorker] = useState(initialWorker || null);
  const [loading, setLoading] = useState(!initialWorker);
  const [activeTab, setActiveTab] = useState("overview"); // overview, portfolio, reviews, booking

  // Booking form state
  const todayStr = getKolkataDateString();
  const tomorrowStr = getKolkataTomorrowString();
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(2);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [nowTick, setNowTick] = useState(Date.now());

  // Real-time slot availability recalculation timer
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 15000); // 15s refresh
    return () => clearInterval(timer);
  }, []);

  // Automatically clear selected slot if it becomes expired
  useEffect(() => {
    if (selectedDate && selectedTime) {
      if (isSlotExpired(selectedTime, selectedDate)) {
        setSelectedTime("");
        setBookingError("Your selected time slot has already passed. Please choose another available slot.");
      }
    }
  }, [selectedDate, selectedTime, nowTick]);

  // Fetch full worker details (reviews, portfolio, etc.)
  useEffect(() => {
    let isMounted = true;
    async function loadWorker() {
      try {
        const id = workerId || initialWorker?._id;
        if (!id) return;
        const fullData = await getWorkerById(id);
        
        try {
          const revData = await getWorkerReviews(id);
          if (revData && revData.reviews && revData.reviews.length > 0) {
            const formatted = revData.reviews.map(r => ({
              name: r.customer?.name || "Verified Customer",
              rating: r.rating,
              comment: r.comment,
              date: new Date(r.createdAt).toLocaleDateString(),
              service: r.booking?.service || fullData.category
            }));
            fullData.reviews = formatted;
            fullData.rating = revData.averageRating || fullData.rating;
            fullData.totalReviews = revData.totalReviews || fullData.totalReviews;
          }
        } catch (rErr) {
          // keep fallback reviews if fetch fails
        }

        if (isMounted) {
          setWorker(fullData);
          if (fullData.servicesOffered && fullData.servicesOffered.length > 0) {
            setSelectedService(fullData.servicesOffered[0].name || fullData.servicesOffered[0]);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading worker profile:", err);
        if (isMounted) setLoading(false);
      }
    }
    loadWorker();
    return () => { isMounted = false; };
  }, [workerId, initialWorker]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // ─€─€ Unified, reliable scrolling for all 4 navigation tabs ─€─€
  const scrollToSection = useCallback((sectionId) => {
    setActiveTab(sectionId);

    const targetMap = {
      overview: overviewRef,
      portfolio: portfolioRef,
      reviews: reviewsRef,
      booking: bookingRef,
    };

    const targetRef = targetMap[sectionId];
    if (!targetRef?.current) return;

    if (modalBodyRef.current) {
      const container = modalBodyRef.current;
      const targetEl = targetRef.current;
      const containerRect = container.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();

      // Precise offset inside the scrollable container accounting for padding
      const scrollOffset = targetRect.top - containerRect.top + container.scrollTop;

      container.scrollTo({
        top: Math.max(0, scrollOffset - 16),
        behavior: "smooth",
      });
    } else {
      targetRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // Sync active tab with user scroll position inside modalBody
  const handleScroll = useCallback(() => {
    if (!modalBodyRef.current) return;
    const container = modalBodyRef.current;
    const containerTop = container.scrollTop;

    const sections = [
      { id: "booking", ref: bookingRef },
      { id: "reviews", ref: reviewsRef },
      { id: "portfolio", ref: portfolioRef },
      { id: "overview", ref: overviewRef },
    ];

    for (const s of sections) {
      if (s.ref.current) {
        const top = s.ref.current.offsetTop - container.offsetTop;
        if (containerTop >= top - 140) {
          setActiveTab(s.id);
          break;
        }
      }
    }
  }, []);

  const theme = categoryTheme[worker?.category] || {
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    label: worker?.category || "Professional",
    Icon: BriefcaseBusiness
  };
  const CategoryIcon = theme.Icon;

  // Calculate standardized transparent pricing (Single Source of Truth)
  const hourlyRate = worker?.charges || 250;
  const pricing = calculatePricing({
    hourlyRate,
    durationHours: selectedDuration || 2,
    platformFee: 0,
    taxes: 0,
    additionalCharges: 0
  });
  const estimatedTotal = pricing.totalAmount;

  const handleDateChange = (val) => {
    setSelectedDate(val);
    setBookingError("");
    if (val && val < todayStr) {
      setBookingError("Please select today or a future date.");
      setSelectedTime("");
      return;
    }
    if (selectedTime && isSlotExpired(selectedTime, val)) {
      setSelectedTime("");
    }
  };

  const handleSlotClick = (slot) => {
    if (isSlotExpired(slot, selectedDate)) return;
    setSelectedTime(slot);
    setBookingError("");
    // Sync duration with slot length
    const slotHours = parseSlotDurationHours(slot);
    if (slotHours) setSelectedDuration(slotHours);
  };

  // Submit Booking
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    setBookingError("");

    if (!isAuthenticated) {
      navigate("/login?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }

    if (!selectedDate) {
      setBookingError("Please pick a service date.");
      return;
    }
    if (selectedDate < todayStr) {
      setBookingError("Please select today or a future date.");
      return;
    }
    if (!selectedTime) {
      setBookingError("Please select a convenient time slot.");
      return;
    }
    if (isSlotExpired(selectedTime, selectedDate)) {
      setSelectedTime("");
      setBookingError("Your selected time slot has already passed. Please choose another available slot.");
      return;
    }
    if (!address.trim()) {
      setBookingError("Please enter your service delivery address.");
      return;
    }

    setSubmitting(true);
    try {
      await createBooking(token, {
        workerId: worker._id,
        service: selectedService || `${worker.category} Standard Service`,
        date: selectedDate,
        time: selectedTime,
        address: address.trim(),
        notes: notes.trim(),
        estimatedHours: pricing.durationHours,
        estimatedPrice: pricing.totalAmount,
        priceBreakdown: pricing
      });

      setBookingDone(true);
      if (onBookingSuccess) onBookingSuccess(worker);
    } catch (err) {
      setBookingError(err.message || "Failed to create booking. Please try another time slot.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return createPortal(
      <div style={styles.modalOverlay}>
        <div style={{ ...styles.modalContainer, maxWidth: "600px", padding: "4rem 2rem", textAlign: "center" }}>
          <div style={styles.spinner} />
          <p style={{ marginTop: "1.25rem", color: "#6B7280", fontWeight: 600 }}>Loading verified professional profile...</p>
        </div>
      </div>,
      document.body
    );
  }

  if (!worker) return null;

  const navigationTabs = [
    { id: "overview", label: "Overview & Skills", icon: ClipboardList },
    { id: "portfolio", label: `Recent Work (${worker.portfolio?.length || 3})`, icon: Images },
    { id: "reviews", label: `Customer Reviews (${worker.reviews?.length || 3})`, icon: MessageSquare },
    { id: "booking", label: "Book Appointment", icon: CalendarDays },
  ];

  return createPortal(
    <div style={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-worker-name">
      <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        
        {/* Top Floating Close Button */}
        <button
          onClick={onClose}
          style={styles.closeBtn}
          aria-label="Close profile modal"
          title="Close (Esc)"
        >
          <X size={20} color="#374151" />
        </button>

        {/* ─€─€ 1. Hero Header Banner ─€─€ */}
        <div style={styles.heroBanner}>
          <div style={styles.heroContent}>
            
            {/* Avatar / Photo with verified ring */}
            <div style={styles.avatarWrapper}>
              {(worker.profileImage || worker.photo) ? (
                <img
                  src={worker.profileImage || worker.photo}
                  alt={worker.userId?.name || "Professional"}
                  style={styles.avatarImg}
                  onError={(e) => {
                    e.target.style.display = "none";
                    if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div
                style={{
                  ...styles.avatarFallback,
                  background: `linear-gradient(135deg, ${theme.color}, #1E40AF)`,
                  display: (worker.profileImage || worker.photo) ? "none" : "flex",
                }}
              >
                {worker.userId?.name?.charAt(0) || "P"}
              </div>
              <div style={styles.verifiedBadgeFloat} title="Identity & Background Verified">
                <BadgeCheck size={16} color="white" />
              </div>
            </div>

            {/* Profile Info */}
            <div style={{ flex: 1, minWidth: "260px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.4rem" }}>
                <span style={{ ...styles.categoryPill, background: theme.bg, color: theme.color, borderColor: theme.border }}>
                  <CategoryIcon size={14} style={{ marginRight: "0.3rem" }} />
                  {theme.label}
                </span>
                <span style={styles.verifiedPill}>
                  <BadgeCheck size={14} color="#065F46" style={{ marginRight: "0.25rem" }} />
                  Verified Partner
                </span>
                <span style={styles.availabilityPill}>
                  <span style={styles.pulseDot} /> Available Today
                </span>
              </div>

              <h1 id="modal-worker-name" style={styles.profileName}>
                {worker.userId?.name || "Professional Partner"}
              </h1>

              <div style={styles.locationRow}>
                <MapPin size={15} color="#EF4444" />
                <span>{worker.location || "City Service Zone"} &bull; Within 15 km Radius</span>
              </div>

              <div style={styles.statsStrip}>
                <div style={styles.statItem}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "#D97706", fontWeight: 800, fontSize: "1.05rem" }}>
                    <Star size={16} fill="#D97706" color="#D97706" />
                    <span>{parseFloat(worker.rating || 4.8).toFixed(1)}</span>
                  </div>
                  <div style={styles.statLabel}>({worker.reviewsCount || 28} Reviews)</div>
                </div>

                <div style={styles.statDivider} />

                <div style={styles.statItem}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontWeight: 800, fontSize: "1.05rem", color: "#111827" }}>
                    <BriefcaseBusiness size={15} color="#4B5563" />
                    <span>{worker.experience || 6} Years</span>
                  </div>
                  <div style={styles.statLabel}>Experience</div>
                </div>

                <div style={styles.statDivider} />

                <div style={styles.statItem}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.2rem", fontWeight: 800, fontSize: "1.05rem", color: "#2563EB" }}>
                    <IndianRupee size={15} color="#2563EB" />
                    <span>{worker.charges || 350}</span>
                    <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "#6B7280" }}>/hr</span>
                  </div>
                  <div style={styles.statLabel}>Standard Rate</div>
                </div>
              </div>
            </div>

            {/* Top Shortcut CTA Button */}
            <div style={styles.topCtaWrapper}>
              <button
                type="button"
                onClick={() => scrollToSection("booking")}
                style={styles.bookShortcutBtn}
                title="Jump directly to booking calendar"
              >
                <CalendarCheck size={18} color="white" />
                <span>Book This Professional</span>
              </button>
              <div style={{ fontSize: "0.78rem", color: "#6B7280", textAlign: "center", marginTop: "0.35rem", display: "flex", alignItems: "center", gap: "0.3rem", justifyContent: "center" }}>
                <ShieldCheck size={14} color="#059669" />
                <span>Zero advance fee &bull; Pay after service</span>
              </div>
            </div>

          </div>
        </div>

        {/* ─€─€ Navigation Tabs ─€─€ */}
        <div style={styles.tabsBar}>
          {navigationTabs.map((tab) => {
            const TabIcon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => scrollToSection(tab.id)}
                style={{
                  ...styles.tabBtn,
                  color: isCurrent ? "#2563EB" : "#6B7280",
                  borderColor: isCurrent ? "#2563EB" : "transparent",
                  fontWeight: isCurrent ? 700 : 500,
                  background: isCurrent ? "#EFF6FF" : "transparent"
                }}
              >
                <TabIcon size={16} color={isCurrent ? "#2563EB" : "#6B7280"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ─€─€ Scrollable Body ─€─€ */}
        <div
          ref={modalBodyRef}
          onScroll={handleScroll}
          style={styles.modalBody}
        >

          {/* ─€─€ 2. Overview, Bio, Services & Working Hours ─€─€ */}
          <section
            ref={overviewRef}
            id="overview-section"
            style={styles.sectionCard}
          >
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>About the Professional</h2>
              <span style={styles.workingHoursBadge}>
                <Clock3 size={14} color="#334155" style={{ marginRight: "0.35rem" }} />
                {worker.workingHours || "8:00 AM – 8:00 PM (Mon – Sun)"}
              </span>
            </div>
            <p style={styles.bioText}>
              {worker.bio || `Certified and background-checked ${worker.category} specialist with extensive experience in residential and commercial repairs. Punctual, well-equipped, and committed to high-standard workmanship with 30-day post-service guarantee.`}
            </p>

            {/* Skills & Specialties */}
            <div style={{ marginTop: "1.25rem" }}>
              <h3 style={styles.subHeading}>Key Specialties & Skills</h3>
              <div style={styles.skillsGrid}>
                {(worker.skills && worker.skills.length > 0 ? worker.skills : ["Safety Standards", "Rapid Diagnostic", "Premium Tools", "Guaranteed Work"]).map((skill, idx) => (
                  <span key={idx} style={styles.skillPill}>
                    <Check size={13} color="#2563EB" />
                    <span>{skill}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Services Offered Catalog */}
            <div style={{ marginTop: "1.5rem" }}>
              <h3 style={styles.subHeading}>Available Service Offerings</h3>
              <div style={styles.servicesGrid}>
                {(worker.servicesOffered || []).map((srv, idx) => {
                  const sName = srv.name || srv;
                  const sDuration = srv.duration || "1–2 hrs";
                  const sPrice = Math.round((worker.charges || 300) * (srv.priceMultiplier || 1));
                  return (
                    <div key={idx} style={styles.serviceItemCard}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: "#111827", fontSize: "0.95rem" }}>{sName}</div>
                        <div style={{ fontSize: "0.78rem", color: "#6B7280", marginTop: "0.2rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <Clock size={12} color="#6B7280" />
                          <span>Typical duration: {sDuration}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 700, color: "#2563EB", fontSize: "1rem" }}>₹{sPrice}</div>
                        <div style={{ fontSize: "0.72rem", color: "#9CA3AF" }}>Est. Base</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ─€─€ 3. Recent Work & Portfolio Gallery ─€─€ */}
          <section
            ref={portfolioRef}
            id="portfolio-section"
            style={styles.sectionCard}
          >
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Recent Work & Completed Jobs</h2>
                <p style={styles.sectionSubtitle}>Authentic photography from verified customer home visits</p>
              </div>
              <span style={styles.workCountBadge}>
                <Images size={14} color="#2563EB" style={{ marginRight: "0.35rem" }} />
                {worker.portfolio?.length || 3} Showcase Projects
              </span>
            </div>

            <div style={styles.portfolioGrid}>
              {(worker.portfolio || []).map((job, idx) => (
                <div key={idx} style={styles.portfolioCard}>
                  <div style={styles.portfolioImgWrapper}>
                    <img
                      src={job.imageUrl}
                      alt={job.title}
                      style={styles.portfolioImg}
                      loading="lazy"
                    />
                    <span style={styles.portfolioTypeBadge}>{job.serviceType || worker.category}</span>
                    {job.completedDate && (
                      <span style={styles.portfolioDateBadge}>
                        <CalendarDays size={12} style={{ marginRight: "0.25rem" }} />
                        {job.completedDate}
                      </span>
                    )}
                  </div>
                  <div style={styles.portfolioInfo}>
                    <h3 style={styles.portfolioTitle}>{job.title}</h3>
                    <p style={styles.portfolioDesc}>{job.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ─€─€ 4. Customer Reviews Section ─€─€ */}
          <section
            ref={reviewsRef}
            id="reviews-section"
            style={styles.sectionCard}
          >
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Verified Customer Reviews</h2>
                <p style={styles.sectionSubtitle}>Real feedback from homeowners who booked through ServeConnect</p>
              </div>
              <div style={styles.reviewScorePill}>
                <Star size={15} fill="#B45309" color="#B45309" style={{ marginRight: "0.3rem" }} />
                <span>{parseFloat(worker.rating || 4.8).toFixed(1)} / 5.0</span>
              </div>
            </div>

            <div style={styles.reviewsGrid}>
              {(worker.reviews || []).map((rev, idx) => (
                <div key={idx} style={styles.reviewCard}>
                  <div style={styles.reviewCardHeader}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <div style={styles.reviewAvatar}>
                        {rev.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: "#111827", fontSize: "0.92rem" }}>{rev.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "#059669", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <CheckCircle2 size={13} color="#059669" />
                          <span>Verified Customer</span>
                          <span style={{ color: "#6B7280" }}>&bull; {rev.date}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.15rem" }}>
                      {[...Array(Math.floor(rev.rating || 5))].map((_, i) => (
                        <Star key={i} size={14} fill="#F59E0B" color="#F59E0B" />
                      ))}
                    </div>
                  </div>
                  <p style={styles.reviewComment}>"{rev.comment}"</p>
                  {rev.service && (
                    <div style={styles.reviewServiceTag}>Service: {rev.service}</div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ─€─€ 5. Premium Step-by-Step Booking Experience (At Bottom) ─€─€ */}
          <section
            ref={bookingRef}
            id="booking-section"
            style={styles.bookingContainer}
          >
            <div style={styles.bookingHeader}>
              <div style={styles.bookingHeaderIcon}>
                <CalendarCheck size={26} color="#2563EB" />
              </div>
              <div>
                <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#111827", marginBottom: "0.2rem" }}>
                  Book an Appointment with {worker.userId?.name || "this Professional"}
                </h2>
                <p style={{ color: "#4B5563", fontSize: "0.88rem" }}>
                  Complete the quick steps below to reserve your guaranteed service slot.
                </p>
              </div>
            </div>

            {bookingDone ? (
              <div style={styles.bookingSuccessCard}>
                <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#10B981", color: "white", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
                  <CheckCircle2 size={36} color="white" />
                </div>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#065F46", marginBottom: "0.5rem" }}>
                  Booking Successfully Reserved!
                </h3>
                <p style={{ color: "#047857", fontSize: "0.95rem", maxWidth: "480px", margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
                  Your appointment with <strong>{worker.userId?.name}</strong> has been confirmed for <strong>{selectedDate}</strong> during <strong>{selectedTime}</strong>.
                </p>
                <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                  <Link to="/bookings" className="btn btn-primary" style={{ padding: "0.75rem 1.75rem", borderRadius: "10px", fontWeight: 700 }}>
                    View in My Bookings
                  </Link>
                  <button onClick={onClose} className="btn btn-secondary" style={{ padding: "0.75rem 1.75rem", borderRadius: "10px", fontWeight: 600 }}>
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} style={styles.bookingForm}>
                
                {bookingError && (
                  <div style={styles.bookingAlert}>
                    <AlertTriangle size={18} color="#B91C1C" />
                    <span>{bookingError}</span>
                  </div>
                )}

                {/* Step 1: Select Service */}
                <div style={styles.formSection}>
                  <label style={styles.formStepLabel}>
                    <span style={styles.stepNumber}>1</span> Select Required Service
                  </label>
                  <div style={styles.servicePillContainer}>
                    {(worker.servicesOffered || []).map((srv, idx) => {
                      const name = srv.name || srv;
                      const isSelected = selectedService === name;
                      return (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => setSelectedService(name)}
                          style={{
                            ...styles.serviceChoicePill,
                            borderColor: isSelected ? "#2563EB" : "#E5E7EB",
                            background: isSelected ? "#EFF6FF" : "white",
                            color: isSelected ? "#2563EB" : "#374151",
                            fontWeight: isSelected ? 700 : 500,
                          }}
                        >
                          <span>{name}</span>
                          {isSelected && <Check size={14} color="#2563EB" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Date & Step 3: Time Slot */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
                  
                  {/* Step 2: Choose Date */}
                  <div style={styles.formSection}>
                    <label style={styles.formStepLabel}>
                      <span style={styles.stepNumber}>2</span> Choose Service Date
                    </label>
                    <input
                      type="date"
                      min={todayStr}
                      value={selectedDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      required
                      style={styles.dateInput}
                    />
                    <div style={styles.dateShortcuts}>
                      <button
                        type="button"
                        onClick={() => handleDateChange(todayStr)}
                        style={{
                          ...styles.shortcutDateBtn,
                          background: selectedDate === todayStr ? "#EFF6FF" : "white",
                          borderColor: selectedDate === todayStr ? "#2563EB" : "#CBD5E1",
                          color: selectedDate === todayStr ? "#2563EB" : "#475569",
                          fontWeight: selectedDate === todayStr ? 700 : 500
                        }}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDateChange(tomorrowStr)}
                        style={{
                          ...styles.shortcutDateBtn,
                          background: selectedDate === tomorrowStr ? "#EFF6FF" : "white",
                          borderColor: selectedDate === tomorrowStr ? "#2563EB" : "#CBD5E1",
                          color: selectedDate === tomorrowStr ? "#2563EB" : "#475569",
                          fontWeight: selectedDate === tomorrowStr ? 700 : 500
                        }}
                      >
                        Tomorrow
                      </button>
                    </div>
                  </div>

                  {/* Step 3: Choose Time Slot */}
                  <div style={styles.formSection}>
                    <label style={styles.formStepLabel}>
                      <span style={styles.stepNumber}>3</span> Select Preferred Time Slot
                    </label>
                    <div style={styles.timeSlotGrid}>
                      {timeSlots.map((slot, idx) => {
                        const isSelected = selectedTime === slot;
                        const isExpired = isSlotExpired(slot, selectedDate);

                        return (
                          <button
                            type="button"
                            key={idx}
                            disabled={isExpired}
                            onClick={() => handleSlotClick(slot)}
                            style={{
                              ...styles.timeSlotBtn,
                              borderColor: isExpired
                                ? "#E2E8F0"
                                : isSelected
                                ? "#2563EB"
                                : "#E5E7EB",
                              background: isExpired
                                ? "#F1F5F9"
                                : isSelected
                                ? "#2563EB"
                                : "white",
                              color: isExpired
                                ? "#94A3B8"
                                : isSelected
                                ? "white"
                                : "#374151",
                              fontWeight: isSelected ? 700 : 500,
                              cursor: isExpired ? "not-allowed" : "pointer",
                              opacity: isExpired ? 0.75 : 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "0.4rem",
                              padding: "0.65rem 0.85rem"
                            }}
                            title={isExpired ? "This time slot has already passed for today." : `Select ${slot}`}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                              <Clock3 size={13} color={isExpired ? "#94A3B8" : (isSelected ? "white" : "#64748B")} />
                              <span>{slot}</span>
                            </span>
                            {isExpired && (
                              <span style={{
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                background: "#E2E8F0",
                                color: "#64748B",
                                padding: "0.15rem 0.45rem",
                                borderRadius: "4px",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px"
                              }}>
                                Unavailable
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#64748B", marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <Clock3 size={13} color="#94A3B8" />
                      <span>Past or currently elapsed time slots are marked unavailable.</span>
                    </div>
                  </div>

                  {/* Step 4: Booking Duration */}
                  <div style={styles.formSection}>
                    <label style={styles.formStepLabel}>
                      <span style={styles.stepNumber}>4</span> Service Duration
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 110px), 1fr))", gap: "0.6rem" }}>
                      {[
                        { hours: 1, label: "1 Hour", sub: "Quick Fix" },
                        { hours: 2, label: "2 Hours", sub: "Standard" },
                        { hours: 3, label: "3 Hours", sub: "Extended" },
                        { hours: 4, label: "4 Hours", sub: "Deep Job" },
                      ].map((opt) => {
                        const isDurSelected = Number(selectedDuration) === opt.hours;
                        return (
                          <button
                            type="button"
                            key={opt.hours}
                            onClick={() => setSelectedDuration(opt.hours)}
                            style={{
                              padding: "0.65rem 0.5rem",
                              borderRadius: "10px",
                              border: isDurSelected ? "2px solid #2563EB" : "1px solid #CBD5E1",
                              background: isDurSelected ? "#EFF6FF" : "#FFFFFF",
                              color: isDurSelected ? "#1D4ED8" : "#334155",
                              cursor: "pointer",
                              textAlign: "center",
                              transition: "all 0.15s ease"
                            }}
                          >
                            <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>{opt.label}</div>
                            <div style={{ fontSize: "0.7rem", color: isDurSelected ? "#2563EB" : "#64748B", marginTop: "0.1rem" }}>
                              {opt.sub}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Step 5: Service Address */}
                <div style={styles.formSection}>
                  <label style={styles.formStepLabel}>
                    <span style={styles.stepNumber}>5</span> Service Address & Landmark
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Flat 304, Green Valley Apartments, Near City Centre, Patiala"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    style={styles.textInput}
                  />
                </div>

                {/* Step 6: Optional Notes */}
                <div style={styles.formSection}>
                  <label style={styles.formStepLabel}>
                    <span style={styles.stepNumber}>6</span> Specific Issue or Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe any specific problem, main switch location, or special instructions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={styles.textareaInput}
                  />
                </div>

                {/* Step 7: Transparent Payment Summary & Breakdown */}
                <div style={styles.summaryCard}>
                  <div style={styles.summaryHeader}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 700, color: "#111827", fontSize: "1.05rem" }}>
                      <FileText size={18} color="#2563EB" />
                      <span>Payment Summary & Price Breakdown</span>
                    </div>
                    <span style={styles.guaranteeTag}>
                      <ShieldCheck size={14} color="#059669" style={{ marginRight: "0.25rem" }} />
                      100% Transparent
                    </span>
                  </div>

                  <div style={styles.summaryDetails}>
                    <div style={styles.summaryRow}>
                      <span style={{ color: "#6B7280" }}>Professional</span>
                      <strong style={{ color: "#111827" }}>{worker.userId?.name || "Professional"} ({worker.category})</strong>
                    </div>
                    <div style={styles.summaryRow}>
                      <span style={{ color: "#6B7280" }}>Selected Service</span>
                      <strong style={{ color: "#111827" }}>{selectedService || `${worker.category} Standard Service`}</strong>
                    </div>
                    <div style={styles.summaryRow}>
                      <span style={{ color: "#6B7280" }}>Appointment Schedule</span>
                      <strong style={{ color: selectedDate && selectedTime ? "#2563EB" : "#9CA3AF" }}>
                        {selectedDate && selectedTime ? `${selectedDate} at ${selectedTime}` : "Please select date & time slot"}
                      </strong>
                    </div>

                    {/* Itemized Payment Table */}
                    <div style={{ marginTop: "0.85rem", borderTop: "1px solid #E2E8F0", paddingTop: "0.75rem" }}>
                      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.5rem" }}>
                        Payment Breakdown
                      </div>
                      <div style={styles.summaryRow}>
                        <span style={{ color: "#64748B" }}>Professional hourly rate</span>
                        <span style={{ fontWeight: 600, color: "#0F172A" }}>₹{pricing.hourlyRate}/hr</span>
                      </div>
                      <div style={styles.summaryRow}>
                        <span style={{ color: "#64748B" }}>Booking duration</span>
                        <span style={{ fontWeight: 600, color: "#0F172A" }}>{pricing.durationHours} {pricing.durationHours === 1 ? "hour" : "hours"}</span>
                      </div>
                      <div style={{ ...styles.summaryRow, background: "#F8FAFC", padding: "0.45rem 0.65rem", borderRadius: "8px", margin: "0.3rem 0" }}>
                        <span style={{ fontWeight: 600, color: "#1E293B" }}>Service cost (₹{pricing.hourlyRate} &times; {pricing.durationHours} hrs)</span>
                        <strong style={{ color: "#0F172A", fontSize: "1rem" }}>₹{pricing.serviceCost}</strong>
                      </div>
                      <div style={styles.summaryRow}>
                        <span style={{ color: "#64748B" }}>Platform fee</span>
                        <span style={{ color: "#059669", fontWeight: 600 }}>{pricing.platformFee === 0 ? "₹0 (Platform Promo)" : `₹${pricing.platformFee}`}</span>
                      </div>
                      <div style={styles.summaryRow}>
                        <span style={{ color: "#64748B" }}>GST / Applicable taxes</span>
                        <span style={{ color: "#64748B", fontWeight: 600 }}>{pricing.taxes === 0 ? "₹0 (Exempt/Included)" : `₹${pricing.taxes}`}</span>
                      </div>
                      <div style={styles.summaryRow}>
                        <span style={{ color: "#64748B" }}>Additional charges</span>
                        <span style={{ color: "#64748B", fontWeight: 600 }}>₹{pricing.additionalCharges}</span>
                      </div>
                    </div>

                    {/* Total Row */}
                    <div style={{ ...styles.summaryRow, borderTop: "1.5px dashed #CBD5E1", paddingTop: "0.85rem", marginTop: "0.5rem" }}>
                      <div>
                        <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#111827", display: "block" }}>Total Payable</span>
                        <span style={{ fontSize: "0.74rem", color: "#059669", fontWeight: 600 }}>₹0 advance &bull; Pay after job completion</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontWeight: 800, fontSize: "1.45rem", color: "#2563EB" }}>₹{pricing.totalAmount}</span>
                        <div style={{ fontSize: "0.72rem", color: "#64748B" }}>Via Razorpay / Cards</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 8: Confirm Button */}
                <div style={{ display: "flex", gap: "1rem", alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap", marginTop: "1rem" }}>
                  <button
                    type="button"
                    onClick={onClose}
                    style={styles.cancelModalBtn}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      ...styles.submitBookingBtn,
                      opacity: submitting ? 0.7 : 1,
                      cursor: submitting ? "not-allowed" : "pointer"
                    }}
                  >
                    {submitting ? (
                      <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={styles.miniSpinner} /> Reserving Appointment...
                      </span>
                    ) : (
                      <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <CheckCircle2 size={18} color="white" />
                        <span>Confirm Booking &bull; ₹{pricing.totalAmount}</span>
                      </span>
                    )}
                  </button>
                </div>

              </form>
            )}

          </section>

        </div>

      </div>
    </div>,
    document.body
  );
}

// ─€─€─€ Inline CSS Styles for Modern Urban Company Look ─€─€─€
const styles = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(17, 24, 39, 0.72)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "1rem",
    overflowY: "auto",
  },
  modalContainer: {
    width: "100%",
    maxWidth: "960px",
    maxHeight: "92vh",
    background: "#F8FAFC",
    borderRadius: "24px",
    boxShadow: "0 25px 60px -12px rgba(0, 0, 0, 0.28)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    position: "relative",
    border: "1px solid rgba(255, 255, 255, 0.8)",
  },
  closeBtn: {
    position: "absolute",
    top: "1.25rem",
    right: "1.25rem",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "rgba(255, 255, 255, 0.95)",
    border: "1px solid #E5E7EB",
    color: "#374151",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 10,
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    transition: "all 0.15s ease",
  },
  heroBanner: {
    background: "white",
    borderBottom: "1px solid #E5E7EB",
    padding: "clamp(1.25rem, 3vw, 2rem) clamp(1rem, 3vw, 2rem) 1.25rem",
    position: "relative",
  },
  heroContent: {
    display: "flex",
    alignItems: "flex-start",
    gap: "1.25rem",
    flexWrap: "wrap",
  },
  avatarWrapper: {
    position: "relative",
    width: "90px",
    height: "90px",
    borderRadius: "20px",
    overflow: "visible",
    flexShrink: 0,
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: "20px",
    objectFit: "cover",
    boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    borderRadius: "20px",
    color: "white",
    fontWeight: 800,
    fontSize: "2.2rem",
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedBadgeFloat: {
    position: "absolute",
    bottom: "-6px",
    right: "-6px",
    background: "#10B981",
    color: "white",
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid white",
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
  },
  categoryPill: {
    fontSize: "0.8rem",
    fontWeight: 700,
    padding: "0.25rem 0.7rem",
    borderRadius: "20px",
    border: "1px solid",
    display: "inline-flex",
    alignItems: "center",
  },
  verifiedPill: {
    fontSize: "0.75rem",
    fontWeight: 700,
    background: "#ECFDF5",
    color: "#065F46",
    padding: "0.25rem 0.7rem",
    borderRadius: "20px",
    border: "1px solid #A7F3D0",
    display: "inline-flex",
    alignItems: "center",
  },
  availabilityPill: {
    fontSize: "0.75rem",
    fontWeight: 600,
    background: "#F0FDF4",
    color: "#166534",
    padding: "0.25rem 0.7rem",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
  },
  pulseDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#22C55E",
    display: "inline-block",
  },
  profileName: {
    fontSize: "1.75rem",
    fontWeight: 800,
    color: "#111827",
    margin: "0.2rem 0 0.35rem",
    letterSpacing: "-0.02em",
  },
  locationRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    color: "#4B5563",
    fontSize: "0.88rem",
    marginBottom: "1rem",
  },
  statsStrip: {
    display: "flex",
    alignItems: "center",
    gap: "clamp(0.75rem, 2vw, 1.25rem)",
    background: "#F8FAFC",
    padding: "0.6rem 0.85rem",
    borderRadius: "14px",
    border: "1px solid #E2E8F0",
    width: "fit-content",
    maxWidth: "100%",
    flexWrap: "wrap",
    boxSizing: "border-box",
  },
  statItem: {
    display: "flex",
    flexDirection: "column",
  },
  statLabel: {
    fontSize: "0.74rem",
    color: "#6B7280",
    fontWeight: 500,
  },
  statDivider: {
    width: "1px",
    height: "28px",
    background: "#CBD5E1",
  },
  topCtaWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "center",
    marginLeft: "auto",
    paddingTop: "0.25rem",
  },
  bookShortcutBtn: {
    background: "linear-gradient(135deg, #1E4E8C 0%, #2A64AC 100%)",
    color: "white",
    border: "none",
    borderRadius: "14px",
    padding: "0.85rem 1.5rem",
    fontWeight: 700,
    fontSize: "0.95rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(30, 78, 140, 0.25)",
    transition: "all 0.2s ease",
    fontFamily: "'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif",
  },
  tabsBar: {
    display: "flex",
    background: "white",
    borderBottom: "1px solid #E5E7EB",
    padding: "0 1.5rem",
    overflowX: "auto",
    gap: "0.5rem",
    flexShrink: 0,
  },
  tabBtn: {
    padding: "0.85rem 1.1rem",
    border: "none",
    borderBottom: "3px solid transparent",
    fontSize: "0.88rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.45rem",
    whiteSpace: "nowrap",
    transition: "all 0.15s ease",
  },
  modalBody: {
    padding: "clamp(1rem, 2.5vw, 1.75rem) clamp(0.85rem, 2.5vw, 2rem)",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    WebkitOverflowScrolling: "touch",
  },
  sectionCard: {
    background: "white",
    borderRadius: "18px",
    padding: "1.75rem",
    border: "1px solid #E5E7EB",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1rem",
    flexWrap: "wrap",
    gap: "0.5rem",
  },
  sectionTitle: {
    fontSize: "1.25rem",
    fontWeight: 800,
    color: "#111827",
    letterSpacing: "-0.01em",
  },
  sectionSubtitle: {
    fontSize: "0.82rem",
    color: "#6B7280",
    marginTop: "0.15rem",
  },
  workingHoursBadge: {
    background: "#F1F5F9",
    color: "#334155",
    padding: "0.3rem 0.75rem",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
  },
  bioText: {
    color: "#374151",
    fontSize: "0.95rem",
    lineHeight: 1.65,
  },
  subHeading: {
    fontSize: "0.92rem",
    fontWeight: 700,
    color: "#1F2937",
    marginBottom: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  skillsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.6rem",
  },
  skillPill: {
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    padding: "0.35rem 0.75rem",
    fontSize: "0.83rem",
    fontWeight: 600,
    color: "#334155",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
  },
  servicesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "0.75rem",
  },
  serviceItemCard: {
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "12px",
    padding: "0.85rem 1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  workCountBadge: {
    background: "#EFF6FF",
    color: "#2563EB",
    padding: "0.25rem 0.75rem",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
  },
  portfolioGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1.25rem",
  },
  portfolioCard: {
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "16px",
    overflow: "hidden",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  portfolioImgWrapper: {
    position: "relative",
    width: "100%",
    height: "170px",
    background: "#E2E8F0",
    overflow: "hidden",
  },
  portfolioImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.3s ease",
  },
  portfolioTypeBadge: {
    position: "absolute",
    top: "0.6rem",
    left: "0.6rem",
    background: "rgba(17, 24, 39, 0.75)",
    backdropFilter: "blur(4px)",
    color: "white",
    padding: "0.2rem 0.6rem",
    borderRadius: "8px",
    fontSize: "0.72rem",
    fontWeight: 600,
  },
  portfolioDateBadge: {
    position: "absolute",
    bottom: "0.6rem",
    right: "0.6rem",
    background: "rgba(255, 255, 255, 0.9)",
    color: "#1F2937",
    padding: "0.2rem 0.55rem",
    borderRadius: "6px",
    fontSize: "0.72rem",
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
  },
  portfolioInfo: {
    padding: "1rem",
  },
  portfolioTitle: {
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "#111827",
    marginBottom: "0.35rem",
    lineHeight: 1.35,
  },
  portfolioDesc: {
    fontSize: "0.82rem",
    color: "#6B7280",
    lineHeight: 1.5,
  },
  reviewScorePill: {
    background: "#FFFBEB",
    color: "#B45309",
    border: "1px solid #FDE68A",
    fontWeight: 800,
    fontSize: "0.9rem",
    padding: "0.35rem 0.85rem",
    borderRadius: "20px",
    display: "inline-flex",
    alignItems: "center",
  },
  reviewsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "1rem",
  },
  reviewCard: {
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "14px",
    padding: "1.1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
  },
  reviewCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  reviewAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #3B82F6, #1E40AF)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "0.95rem",
  },
  reviewComment: {
    fontSize: "0.86rem",
    color: "#374151",
    lineHeight: 1.55,
    fontStyle: "italic",
  },
  reviewServiceTag: {
    fontSize: "0.72rem",
    color: "#9CA3AF",
    marginTop: "auto",
  },
  bookingContainer: {
    background: "white",
    borderRadius: "20px",
    padding: "2rem",
    border: "2px solid #DBEAFE",
    boxShadow: "0 8px 30px rgba(37, 99, 235, 0.08)",
  },
  bookingHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "1rem",
    marginBottom: "1.75rem",
    borderBottom: "1px solid #F1F5F9",
    paddingBottom: "1.25rem",
  },
  bookingHeaderIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background: "#EFF6FF",
    color: "#2563EB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bookingSuccessCard: {
    textAlign: "center",
    padding: "2.5rem 1.5rem",
    background: "#F0FDF4",
    borderRadius: "16px",
    border: "1px solid #BBF7D0",
  },
  bookingForm: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  bookingAlert: {
    background: "#FEF2F2",
    color: "#B91C1C",
    border: "1px solid #FECACA",
    padding: "0.85rem 1rem",
    borderRadius: "10px",
    fontSize: "0.9rem",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  formSection: {
    display: "flex",
    flexDirection: "column",
  },
  formStepLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    fontSize: "0.95rem",
    fontWeight: 700,
    color: "#1E293B",
    marginBottom: "0.75rem",
  },
  stepNumber: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "var(--primary, #2563EB)",
    color: "white",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.75rem",
    fontWeight: 800,
  },
  servicePillContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.6rem",
  },
  serviceChoicePill: {
    padding: "0.65rem 1rem",
    borderRadius: "12px",
    border: "1.5px solid",
    fontSize: "0.88rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    transition: "all 0.15s ease",
  },
  dateInput: {
    padding: "0.75rem 1rem",
    border: "1.5px solid #E2E8F0",
    borderRadius: "12px",
    fontSize: "0.95rem",
    outline: "none",
    background: "#F8FAFC",
    color: "#111827",
    fontWeight: 600,
    width: "100%",
    boxSizing: "border-box",
  },
  dateShortcuts: {
    display: "flex",
    gap: "0.5rem",
    marginTop: "0.5rem",
  },
  shortcutDateBtn: {
    background: "#F1F5F9",
    color: "#475569",
    border: "1px solid #E2E8F0",
    padding: "0.25rem 0.65rem",
    borderRadius: "6px",
    fontSize: "0.78rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  timeSlotGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: "0.5rem",
  },
  timeSlotBtn: {
    padding: "0.65rem 0.75rem",
    borderRadius: "10px",
    border: "1.5px solid",
    fontSize: "0.82rem",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s ease",
  },
  textInput: {
    padding: "0.8rem 1rem",
    border: "1.5px solid #E2E8F0",
    borderRadius: "12px",
    fontSize: "0.92rem",
    outline: "none",
    background: "#F8FAFC",
    color: "#111827",
    width: "100%",
    boxSizing: "border-box",
  },
  textareaInput: {
    padding: "0.8rem 1rem",
    border: "1.5px solid #E2E8F0",
    borderRadius: "12px",
    fontSize: "0.92rem",
    outline: "none",
    background: "#F8FAFC",
    color: "#111827",
    width: "100%",
    resize: "vertical",
    boxSizing: "border-box",
  },
  summaryCard: {
    background: "#F8FAFC",
    border: "1.5px solid #E2E8F0",
    borderRadius: "16px",
    padding: "1.25rem 1.5rem",
  },
  summaryHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
    borderBottom: "1px solid #E2E8F0",
    paddingBottom: "0.75rem",
    flexWrap: "wrap",
    gap: "0.5rem",
  },
  guaranteeTag: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#059669",
    background: "#ECFDF5",
    padding: "0.25rem 0.65rem",
    borderRadius: "12px",
    display: "inline-flex",
    alignItems: "center",
  },
  summaryDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.88rem",
  },
  cancelModalBtn: {
    background: "white",
    color: "#4B5563",
    border: "1.5px solid #E5E7EB",
    borderRadius: "12px",
    padding: "0.85rem 1.5rem",
    fontWeight: 600,
    fontSize: "0.95rem",
    cursor: "pointer",
  },
  submitBookingBtn: {
    background: "linear-gradient(135deg, #1E4E8C 0%, #2A64AC 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "0.85rem 2rem",
    fontWeight: 800,
    fontSize: "1rem",
    boxShadow: "0 4px 16px rgba(30, 78, 140, 0.28)",
    transition: "all 0.2s ease",
    fontFamily: "'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif",
  },
  spinner: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    border: "4px solid #E5E7EB",
    borderTopColor: "var(--color-primary, #1E4E8C)",
    animation: "spin 0.8s linear infinite",
    margin: "0 auto",
  },
  miniSpinner: {
    width: "16px",
    height: "16px",
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.4)",
    borderTopColor: "white",
    animation: "spin 0.8s linear infinite",
    display: "inline-block",
  }
};
