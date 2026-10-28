import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createBooking } from "../services/bookingService";
import { getWorkerById } from "../services/workerService";
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
  Plumber:     { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", label: "Plumber", Icon: Wrench },
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
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedService, setSelectedService] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);
  const [bookingError, setBookingError] = useState("");

  // Fetch full worker details (reviews, portfolio, etc.)
  useEffect(() => {
    let isMounted = true;
    async function loadWorker() {
      try {
        const id = workerId || initialWorker?._id;
        if (!id) return;
        const fullData = await getWorkerById(id);
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

  // ── Unified, reliable scrolling for all 4 navigation tabs ──
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

  // Calculate dynamic estimated price
  const baseRate = worker?.charges || 300;
  let serviceMultiplier = 1.0;
  if (worker?.servicesOffered && selectedService) {
    const sObj = worker.servicesOffered.find(s => (s.name || s) === selectedService);
    if (sObj && sObj.priceMultiplier) serviceMultiplier = sObj.priceMultiplier;
  }
  const estimatedTotal = Math.round(baseRate * serviceMultiplier);

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
      setBookingError("Cannot schedule a booking in the past. Please select today or a future date.");
      return;
    }
    if (!selectedTime) {
      setBookingError("Please select a convenient time slot.");
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
        estimatedPrice: estimatedTotal
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
    return (
      <div style={styles.modalOverlay}>
        <div style={{ ...styles.modalContainer, maxWidth: "600px", padding: "4rem 2rem", textAlign: "center" }}>
          <div style={styles.spinner} />
          <p style={{ marginTop: "1.25rem", color: "#6B7280", fontWeight: 600 }}>Loading verified professional profile...</p>
        </div>
      </div>
    );
  }

  if (!worker) return null;

  const navigationTabs = [
    { id: "overview", label: "Overview & Skills", icon: ClipboardList },
    { id: "portfolio", label: `Recent Work (${worker.portfolio?.length || 3})`, icon: Images },
    { id: "reviews", label: `Customer Reviews (${worker.reviews?.length || 3})`, icon: MessageSquare },
    { id: "booking", label: "Book Appointment", icon: CalendarDays },
  ];

  return (
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

        {/* ── 1. Hero Header Banner ── */}
        <div style={styles.heroBanner}>
          <div style={styles.heroContent}>
            
            {/* Avatar / Photo with verified ring */}
            <div style={styles.avatarWrapper}>
              {worker.photo ? (
                <img
                  src={worker.photo}
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
                  display: worker.photo ? "none" : "flex",
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

        {/* ── Navigation Tabs ── */}
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
                  color: isCurrent ? "var(--primary)" : "#6B7280",
                  borderColor: isCurrent ? "var(--primary)" : "transparent",
                  fontWeight: isCurrent ? 700 : 500,
                  background: isCurrent ? "#EFF6FF" : "transparent"
                }}
              >
                <TabIcon size={16} color={isCurrent ? "var(--primary)" : "#6B7280"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Scrollable Body ── */}
        <div
          ref={modalBodyRef}
          onScroll={handleScroll}
          style={styles.modalBody}
        >

          {/* ── 2. Overview, Bio, Services & Working Hours ── */}
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

          {/* ── 3. Recent Work & Portfolio Gallery ── */}
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
                <Images size={14} color="var(--primary)" style={{ marginRight: "0.35rem" }} />
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

          {/* ── 4. Customer Reviews Section ── */}
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

          {/* ── 5. Premium Step-by-Step Booking Experience (At Bottom) ── */}
          <section
            ref={bookingRef}
            id="booking-section"
            style={styles.bookingContainer}
          >
            <div style={styles.bookingHeader}>
              <div style={styles.bookingHeaderIcon}>
                <CalendarCheck size={26} color="var(--primary)" />
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
                            borderColor: isSelected ? "var(--primary)" : "#E5E7EB",
                            background: isSelected ? "#EFF6FF" : "white",
                            color: isSelected ? "var(--primary)" : "#374151",
                            fontWeight: isSelected ? 700 : 500,
                          }}
                        >
                          <span>{name}</span>
                          {isSelected && <Check size={14} color="var(--primary)" />}
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
                      onChange={(e) => setSelectedDate(e.target.value)}
                      required
                      style={styles.dateInput}
                    />
                    <div style={styles.dateShortcuts}>
                      <button
                        type="button"
                        onClick={() => setSelectedDate(todayStr)}
                        style={styles.shortcutDateBtn}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const tom = new Date();
                          tom.setDate(tom.getDate() + 1);
                          setSelectedDate(tom.toISOString().split("T")[0]);
                        }}
                        style={styles.shortcutDateBtn}
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
                        return (
                          <button
                            type="button"
                            key={idx}
                            onClick={() => setSelectedTime(slot)}
                            style={{
                              ...styles.timeSlotBtn,
                              borderColor: isSelected ? "var(--primary)" : "#E5E7EB",
                              background: isSelected ? "var(--primary)" : "white",
                              color: isSelected ? "white" : "#374151",
                              fontWeight: isSelected ? 700 : 500
                            }}
                          >
                            <Clock3 size={13} style={{ marginRight: "0.3rem" }} />
                            <span>{slot}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Step 4: Service Address */}
                <div style={styles.formSection}>
                  <label style={styles.formStepLabel}>
                    <span style={styles.stepNumber}>4</span> Service Address & Landmark
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

                {/* Step 5: Optional Notes */}
                <div style={styles.formSection}>
                  <label style={styles.formStepLabel}>
                    <span style={styles.stepNumber}>5</span> Specific Issue or Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe any specific problem, main switch location, or special instructions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={styles.textareaInput}
                  />
                </div>

                {/* Step 6 & 7: Price Breakdown & Booking Summary Card */}
                <div style={styles.summaryCard}>
                  <div style={styles.summaryHeader}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 700, color: "#111827", fontSize: "1.05rem" }}>
                      <FileText size={18} color="var(--primary)" />
                      <span>Booking Price & Summary</span>
                    </div>
                    <span style={styles.guaranteeTag}>
                      <ShieldCheck size={14} color="#059669" style={{ marginRight: "0.25rem" }} />
                      100% Satisfaction Guarantee
                    </span>
                  </div>

                  <div style={styles.summaryDetails}>
                    <div style={styles.summaryRow}>
                      <span style={{ color: "#6B7280" }}>Professional</span>
                      <strong style={{ color: "#111827" }}>{worker.userId?.name} ({worker.category})</strong>
                    </div>
                    <div style={styles.summaryRow}>
                      <span style={{ color: "#6B7280" }}>Selected Service</span>
                      <strong style={{ color: "#111827" }}>{selectedService || "Standard Diagnostic & Repair"}</strong>
                    </div>
                    <div style={styles.summaryRow}>
                      <span style={{ color: "#6B7280" }}>Appointment Schedule</span>
                      <strong style={{ color: selectedDate && selectedTime ? "#2563EB" : "#9CA3AF" }}>
                        {selectedDate && selectedTime ? `${selectedDate} at ${selectedTime}` : "Please select date & time slot"}
                      </strong>
                    </div>
                    <div style={styles.summaryRow}>
                      <span style={{ color: "#6B7280" }}>Base Hourly Rate</span>
                      <span>₹{worker.charges || 300}/hr</span>
                    </div>
                    <div style={styles.summaryRow}>
                      <span style={{ color: "#6B7280" }}>Safety & Trust Fee</span>
                      <span style={{ color: "#059669", fontWeight: 600 }}>FREE (Platform Promo)</span>
                    </div>
                    <div style={{ ...styles.summaryRow, borderTop: "1.5px dashed #E5E7EB", paddingTop: "0.85rem", marginTop: "0.4rem" }}>
                      <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#111827" }}>Estimated Total Price</span>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontWeight: 800, fontSize: "1.35rem", color: "#2563EB" }}>₹{estimatedTotal}</span>
                        <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>Pay after job completion</div>
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
                        <span>Confirm Booking &bull; ₹{estimatedTotal}</span>
                      </span>
                    )}
                  </button>
                </div>

              </form>
            )}

          </section>

        </div>

      </div>
    </div>
  );
}

// ─── Inline CSS Styles for Modern Urban Company Look ───
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
    padding: "2rem 2rem 1.5rem",
    position: "relative",
  },
  heroContent: {
    display: "flex",
    alignItems: "flex-start",
    gap: "1.5rem",
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
    gap: "1.25rem",
    background: "#F8FAFC",
    padding: "0.6rem 1rem",
    borderRadius: "14px",
    border: "1px solid #E2E8F0",
    width: "fit-content",
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
    background: "var(--primary, #2563EB)",
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
    boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
    transition: "all 0.2s ease",
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
    padding: "1.75rem 2rem",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "1.75rem",
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
    color: "var(--primary)",
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
    color: "var(--primary)",
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
    background: "var(--primary, #2563EB)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "0.85rem 2rem",
    fontWeight: 800,
    fontSize: "1rem",
    boxShadow: "0 4px 16px rgba(37, 99, 235, 0.35)",
    transition: "all 0.2s ease",
  },
  spinner: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    border: "4px solid #E5E7EB",
    borderTopColor: "var(--primary, #2563EB)",
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
