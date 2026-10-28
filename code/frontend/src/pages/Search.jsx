import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { getWorkers } from "../services/workerService";
import { useAuth } from "../context/AuthContext";
import { useLocationState } from "../context/LocationContext";
import WorkerProfileModal from "../components/WorkerProfileModal";
import {
  Search as SearchIcon,
  MapPin,
  Star,
  BadgeCheck,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  X,
  Zap,
  Wrench,
  Hammer,
  Paintbrush,
  Sparkles,
  Snowflake,
  BriefcaseBusiness,
} from "lucide-react";

const categoryColors = {
  Electrician: { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", Icon: Zap },
  Plumber:     { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", Icon: Wrench },
  Carpenter:   { color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", Icon: Hammer },
  Painter:     { color: "#DB2777", bg: "#FDF2F8", border: "#FBCFE8", Icon: Paintbrush },
  Cleaning:    { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", Icon: Sparkles },
  "AC Repair": { color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC", Icon: Snowflake },
};

function StarRating({ rating, count = 28 }) {
  const r = parseFloat(rating) || 4.8;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
      <span style={{ color: "#D97706", fontWeight: 800, fontSize: "0.92rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
        <Star size={14} fill="#D97706" color="#D97706" />
        <span>{r.toFixed(1)}</span>
      </span>
      <span style={{ color: "#64748B", fontSize: "0.78rem", fontWeight: 500 }}>
        ({count})
      </span>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div style={{ background: "white", borderRadius: "18px", border: "1.5px solid #E2E8F0", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <div style={{ width: "60px", height: "60px", borderRadius: "16px", background: "#E2E8F0", animation: "shimmer 1.5s infinite" }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ height: "18px", width: "65%", background: "#E2E8F0", borderRadius: "4px" }} />
          <div style={{ height: "14px", width: "40%", background: "#E2E8F0", borderRadius: "4px" }} />
        </div>
      </div>
      <div style={{ height: "50px", background: "#F1F5F9", borderRadius: "10px" }} />
      <div style={{ height: "42px", background: "#E2E8F0", borderRadius: "10px" }} />
    </div>
  );
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { location, setLocation } = useLocationState();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [searchInput, setSearchInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [isServiceAreaSupported, setIsServiceAreaSupported] = useState(true);
  const [supportedCitiesList, setSupportedCitiesList] = useState(["Patiala", "Delhi", "Chandigarh", "Ludhiana", "Mohali"]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [notified, setNotified] = useState(false);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const searchLoc =
        location === "Detecting..." || location === "Location Error" || location === "Location Denied"
          ? ""
          : location;
      const res = await getWorkers(category, searchLoc);

      if (res && res.isServiceAreaSupported === false) {
        setIsServiceAreaSupported(false);
        setSupportedCitiesList(res.supportedCities || ["Patiala", "Delhi", "Chandigarh", "Ludhiana", "Mohali"]);
        setWorkers([]);
      } else {
        setIsServiceAreaSupported(true);
        const list = Array.isArray(res) ? res : (res.workers || []);
        setWorkers(list);
        if (res.supportedCities) setSupportedCitiesList(res.supportedCities);
      }
    } catch (err) {
      console.error(err);
      setIsServiceAreaSupported(true);
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [searchParams, location, category]);

  // Handle location search bar submit
  const handleLocationSubmit = (e) => {
    e.preventDefault();
    if (locationInput.trim()) {
      setLocation(locationInput.trim());
      setLocationInput("");
    }
  };

  const handleBookingSuccess = (worker) => {
    setToastMessage(`Booking reserved with ${worker.userId?.name}! Check My Bookings.`);
    setTimeout(() => setToastMessage(""), 6000);
  };

  // Filter workers by search input keyword if typed
  const displayedWorkers = searchInput.trim()
    ? workers.filter(w =>
        (w.userId?.name || "").toLowerCase().includes(searchInput.toLowerCase()) ||
        (w.category || "").toLowerCase().includes(searchInput.toLowerCase()) ||
        (w.bio || "").toLowerCase().includes(searchInput.toLowerCase()) ||
        (w.skills || []).some(s => s.toLowerCase().includes(searchInput.toLowerCase()))
      )
    : workers;

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", paddingBottom: "5rem" }}>
      
      {/* ── Toast Notification Banner ── */}
      {toastMessage && (
        <div style={styles.toastBanner} className="animate-slide-up">
          <CheckCircle2 size={18} color="white" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage("")} style={styles.toastCloseBtn} aria-label="Close notification">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Search Header & Dual Search Bar ── */}
      <div style={styles.searchHeaderWrapper}>
        <div style={styles.searchHeaderInner}>
          <div style={{ maxWidth: "680px" }}>
            <div style={styles.badgeLabel}>
              Verified Home Services Marketplace
            </div>
            <h1 style={styles.pageHeading}>
              Find a Trusted Professional
            </h1>
            <p style={styles.pageSubheading}>
              Browse certified local specialists in <strong>{location}</strong>. Inspect previous completed work, verified reviews, and fixed pricing before booking.
            </p>
          </div>

          {/* Dual Search Input Bar: Service Keyword + City Area */}
          <div style={styles.searchInputsContainer}>
            
            {/* Service / Skill Search */}
            <div style={styles.searchInputGroup}>
              <SearchIcon size={16} color="#64748B" />
              <input
                type="text"
                placeholder="Search by service or specialty (e.g. Plumber, Wiring, AC)..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={styles.searchField}
              />
              {searchInput && (
                <button onClick={() => setSearchInput("")} style={styles.clearBtn} aria-label="Clear search">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* City / Service Area Search */}
            <form onSubmit={handleLocationSubmit} style={styles.locationInputGroup}>
              <MapPin size={16} color="var(--primary)" />
              <input
                type="text"
                placeholder={`Current city: ${location}...`}
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                style={styles.searchField}
              />
              <button type="submit" style={styles.changeLocBtn}>
                Update City
              </button>
            </form>

          </div>

        </div>

        {/* Quick Category Filter Pills */}
        <div style={styles.categoryPillsStrip}>
          {[
            { id: "", label: "All Services", Icon: null },
            { id: "Electrician", label: "Electrician", Icon: Zap },
            { id: "Plumber", label: "Plumber", Icon: Wrench },
            { id: "Carpenter", label: "Carpenter", Icon: Hammer },
            { id: "Painter", label: "Painter", Icon: Paintbrush },
            { id: "Cleaning", label: "Cleaning", Icon: Sparkles },
            { id: "AC Repair", label: "AC Repair", Icon: Snowflake },
          ].map((cat) => {
            const isSelected = category === cat.id;
            const CatIcon = cat.Icon;
            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                style={{
                  ...styles.categoryQuickPill,
                  background: isSelected ? "var(--primary)" : "white",
                  color: isSelected ? "white" : "#374151",
                  borderColor: isSelected ? "var(--primary)" : "#E2E8F0",
                  fontWeight: isSelected ? 700 : 500,
                  boxShadow: isSelected ? "0 2px 8px rgba(37,99,235,0.25)" : "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem"
                }}
              >
                {CatIcon && <CatIcon size={14} color={isSelected ? "white" : "currentColor"} />}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Listing Content ── */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        
        {/* Results Metadata Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontWeight: 800, color: "#0F172A", fontSize: "1.1rem" }}>
              {loading ? "Checking availability..." : isServiceAreaSupported ? `Showing verified professionals in ${location}` : `Coverage Notice for ${location}`}
            </span>
            {isServiceAreaSupported && (
              <>
                <span style={{ color: "#9CA3AF" }}>&bull;</span>
                <span style={{ color: "#059669", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span style={styles.greenDot} /> Available for immediate booking
                </span>
              </>
            )}
          </div>

          <div style={{ fontSize: "0.85rem", color: "#64748B" }}>
            {displayedWorkers.length} {displayedWorkers.length === 1 ? "professional" : "professionals"} available
          </div>
        </div>

        {/* ── Condition A: Outside Supported Service Area Empty State ── */}
        {!isServiceAreaSupported ? (
          <div style={styles.outsideAreaCard} className="animate-slide-up">
            <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
              <MapPin size={48} color="var(--primary)" />
            </div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0F172A", marginBottom: "0.5rem" }}>
              Sorry, ServeConnect isn't available in your area yet.
            </h2>
            <p style={{ color: "#64748B", maxWidth: "560px", margin: "0 auto 1.5rem", fontSize: "0.95rem", lineHeight: 1.6 }}>
              We're actively working to bring trusted, verified home services to <strong>{location}</strong>. In the meantime, try another nearby service area or check back soon.
            </p>

            {/* Quick Switch to Supported Cities */}
            <div style={{ marginBottom: "1.75rem" }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1E293B", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "0.75rem" }}>
                Switch to an Active Supported City
              </div>
              <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", flexWrap: "wrap" }}>
                {supportedCitiesList.map((c) => (
                  <button
                    key={c}
                    onClick={() => setLocation(c)}
                    style={styles.supportedAreaBtn}
                  >
                    <MapPin size={13} color="var(--primary)" style={{ marginRight: "0.3rem" }} />
                    <span>{c}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notification / Alert Action */}
            <div style={{ display: "flex", gap: "0.85rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => setLocation("Patiala")}
                className="btn btn-primary"
                style={{ padding: "0.75rem 1.6rem", borderRadius: "12px", fontWeight: 700 }}
              >
                Change Location to Patiala
              </button>
              <button
                onClick={() => {
                  setNotified(true);
                  setTimeout(() => setNotified(false), 4000);
                }}
                className="btn btn-secondary"
                style={{ padding: "0.75rem 1.6rem", borderRadius: "12px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
              >
                {notified ? (
                  <>
                    <Check size={16} />
                    <span>We'll notify you!</span>
                  </>
                ) : (
                  <>
                    <Bell size={16} />
                    <span>Notify Me When Available</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : loading ? (
          /* ── Condition B: Skeleton Loader ── */
          <div style={styles.cardsGrid}>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : displayedWorkers.length === 0 ? (
          /* ── Condition C: No matching category results ── */
          <div style={styles.emptyStateCard} className="animate-slide-up">
            <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
              <SearchIcon size={48} color="#94A3B8" />
            </div>
            <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0F172A", marginBottom: "0.5rem" }}>
              No professionals matching "{category || searchInput}" in {location}
            </h3>
            <p style={{ color: "#64748B", maxWidth: "440px", margin: "0 auto 1.5rem", fontSize: "0.92rem", lineHeight: 1.5 }}>
              Try clearing your search keyword, resetting category filters, or selecting "All Services".
            </p>
            <button
              onClick={() => {
                setCategory("");
                setSearchInput("");
              }}
              style={styles.resetFilterBtn}
            >
              Reset Filters & Show All
            </button>
          </div>
        ) : (
          /* ── Condition D: Professional Cards Grid ── */
          <div style={styles.cardsGrid}>
            {displayedWorkers.map((worker) => {
              const sc = categoryColors[worker.category] || { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", Icon: BriefcaseBusiness };
              const CatIcon = sc.Icon;
              const isHovered = hoveredCardId === worker._id;

              return (
                <div
                  key={worker._id}
                  onMouseEnter={() => setHoveredCardId(worker._id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                  onClick={() => setSelectedWorker(worker)}
                  style={{
                    ...styles.card,
                    borderColor: isHovered ? "var(--primary)" : "#E2E8F0",
                    boxShadow: isHovered
                      ? "0 14px 34px -8px rgba(37, 99, 235, 0.16), 0 4px 12px rgba(0,0,0,0.04)"
                      : "0 2px 6px rgba(0, 0, 0, 0.04)",
                    transform: isHovered ? "translateY(-5px)" : "none",
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View profile and book ${worker.userId?.name}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedWorker(worker);
                    }
                  }}
                >
                  {/* Category Accent Strip */}
                  <div style={{ height: "4px", background: sc.color }} />

                  <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", height: "calc(100% - 4px)", gap: "1rem" }}>
                    
                    {/* Top Row: Avatar, Name & Category */}
                    <div style={{ display: "flex", gap: "0.9rem", alignItems: "flex-start" }}>
                      
                      {/* Photo Avatar with Fallback */}
                      <div style={styles.cardAvatarWrapper}>
                        {worker.photo ? (
                          <img
                            src={worker.photo}
                            alt={worker.userId?.name || "Professional"}
                            style={styles.cardAvatarImg}
                            onError={(e) => {
                              e.target.style.display = "none";
                              if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : null}
                        <div
                          style={{
                            ...styles.cardAvatarFallback,
                            background: `linear-gradient(135deg, ${sc.color}, #1E40AF)`,
                            display: worker.photo ? "none" : "flex",
                          }}
                        >
                          {worker.userId?.name?.charAt(0) || "P"}
                        </div>
                      </div>

                      {/* Name, Verified Badge & Category */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                          <h3 style={styles.cardName}>
                            {worker.userId?.name || "Verified Professional"}
                          </h3>
                          {/* Animated Arrow Icon */}
                          <ArrowRight
                            size={16}
                            color="var(--primary)"
                            style={{
                              transform: isHovered ? "translateX(4px)" : "translateX(0)",
                              transition: "transform 0.2s ease",
                              flexShrink: 0
                            }}
                          />
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
                          <span style={{ ...styles.cardCategoryBadge, background: sc.bg, color: sc.color, borderColor: sc.border }}>
                            <CatIcon size={12} style={{ marginRight: "0.25rem" }} />
                            <span>{worker.category}</span>
                          </span>
                          <span style={styles.cardVerifiedTag}>
                            <BadgeCheck size={12} color="#065F46" style={{ marginRight: "0.2rem" }} />
                            <span>Verified</span>
                          </span>
                        </div>

                        <div style={styles.cardLocationText}>
                          <MapPin size={13} color="#EF4444" style={{ marginRight: "0.25rem" }} />
                          <span>{worker.location || "City Service Zone"} &bull; <strong style={{ color: "#059669", fontWeight: 600 }}>Available Today</strong></span>
                        </div>
                      </div>

                    </div>

                    {/* Stats Strip: Rating, Experience & Pricing */}
                    <div style={styles.cardStatsStrip}>
                      <div style={styles.cardStatCell}>
                        <StarRating rating={worker.rating} count={worker.reviewsCount || 28} />
                        <div style={styles.cardStatSub}>Rating</div>
                      </div>

                      <div style={styles.cardStatDivider} />

                      <div style={styles.cardStatCell}>
                        <div style={styles.cardStatValue}>{worker.experience || 5} Yrs</div>
                        <div style={styles.cardStatSub}>Experience</div>
                      </div>

                      <div style={styles.cardStatDivider} />

                      <div style={styles.cardStatCell}>
                        <div style={{ ...styles.cardStatValue, color: "#2563EB" }}>₹{worker.charges || 300}</div>
                        <div style={styles.cardStatSub}>Per Hour</div>
                      </div>
                    </div>

                    {/* Bio / Introduction Snippet */}
                    <p style={styles.cardBioSnippet}>
                      {worker.bio || `Experienced ${worker.category} providing reliable installation, diagnostics, and repairs with high safety standards.`}
                    </p>

                    {/* Skills / Portfolio Preview Pills */}
                    <div style={styles.cardSkillsPreview}>
                      {(worker.skills && worker.skills.length > 0 ? worker.skills.slice(0, 3) : ["Safety Inspected", "30-Day Guarantee", "Fast Service"]).map((skill, idx) => (
                        <span key={idx} style={styles.cardMiniSkillPill}>
                          &bull; {skill}
                        </span>
                      ))}
                    </div>

                    {/* Bottom Primary Action Button */}
                    <div style={{ marginTop: "auto", paddingTop: "0.5rem" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWorker(worker);
                        }}
                        style={{
                          ...styles.viewProfileBtn,
                          background: isHovered ? "var(--primary)" : "#F8FAFC",
                          color: isHovered ? "white" : "var(--primary)",
                          borderColor: isHovered ? "var(--primary)" : "#BFDBFE",
                          boxShadow: isHovered ? "0 4px 12px rgba(37,99,235,0.25)" : "none"
                        }}
                      >
                        <span>View Profile & Book</span>
                        <ArrowRight
                          size={15}
                          style={{
                            transform: isHovered ? "translateX(3px)" : "none",
                            transition: "transform 0.2s ease"
                          }}
                        />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ── Full-Screen Profile & Booking Modal ── */}
      {selectedWorker && (
        <WorkerProfileModal
          workerId={selectedWorker._id}
          initialWorker={selectedWorker}
          onClose={() => setSelectedWorker(null)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

    </div>
  );
}

const styles = {
  toastBanner: {
    position: "fixed",
    bottom: "2rem",
    right: "2rem",
    background: "#065F46",
    color: "white",
    padding: "0.9rem 1.4rem",
    borderRadius: "14px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    zIndex: 10000,
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    fontSize: "0.95rem",
    fontWeight: 600,
  },
  toastCloseBtn: {
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.8)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.2rem",
  },
  searchHeaderWrapper: {
    background: "white",
    borderBottom: "1px solid #E2E8F0",
    padding: "2.5rem 1.5rem 1rem",
  },
  searchHeaderInner: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
    marginBottom: "1.75rem",
  },
  badgeLabel: {
    fontSize: "0.78rem",
    fontWeight: 800,
    letterSpacing: "1.5px",
    color: "var(--primary, #2563EB)",
    textTransform: "uppercase",
    marginBottom: "0.4rem",
  },
  pageHeading: {
    fontSize: "2.2rem",
    fontWeight: 800,
    color: "#0F172A",
    letterSpacing: "-0.02em",
    marginBottom: "0.4rem",
  },
  pageSubheading: {
    color: "#475569",
    fontSize: "0.95rem",
    lineHeight: 1.55,
  },
  searchInputsContainer: {
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
    width: "100%",
  },
  searchInputGroup: {
    flex: 2,
    minWidth: "280px",
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    background: "#F8FAFC",
    border: "1.5px solid #CBD5E1",
    borderRadius: "14px",
    padding: "0.75rem 1rem",
  },
  locationInputGroup: {
    flex: 1,
    minWidth: "260px",
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    background: "#F8FAFC",
    border: "1.5px solid #CBD5E1",
    borderRadius: "14px",
    padding: "0.4rem 0.5rem 0.4rem 1rem",
  },
  searchField: {
    width: "100%",
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: "0.92rem",
    color: "#0F172A",
    fontWeight: 500,
  },
  changeLocBtn: {
    background: "var(--primary, #2563EB)",
    color: "white",
    border: "none",
    borderRadius: "10px",
    padding: "0.6rem 1rem",
    fontSize: "0.85rem",
    fontWeight: 700,
    whiteSpace: "nowrap",
    cursor: "pointer",
  },
  clearBtn: {
    background: "none",
    border: "none",
    color: "#94A3B8",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.2rem",
  },
  categoryPillsStrip: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    gap: "0.6rem",
    overflowX: "auto",
    paddingBottom: "0.75rem",
  },
  categoryQuickPill: {
    padding: "0.55rem 1rem",
    borderRadius: "20px",
    border: "1px solid",
    fontSize: "0.85rem",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.15s ease",
  },
  greenDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#10B981",
    display: "inline-block",
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: "1.5rem",
  },
  card: {
    background: "white",
    borderRadius: "20px",
    border: "1.5px solid #E2E8F0",
    overflow: "hidden",
    cursor: "pointer",
    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
    outline: "none",
    display: "flex",
    flexDirection: "column",
  },
  cardAvatarWrapper: {
    position: "relative",
    width: "60px",
    height: "60px",
    borderRadius: "16px",
    overflow: "visible",
    flexShrink: 0,
  },
  cardAvatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: "16px",
    objectFit: "cover",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  cardAvatarFallback: {
    width: "100%",
    height: "100%",
    borderRadius: "16px",
    color: "white",
    fontWeight: 800,
    fontSize: "1.6rem",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  cardName: {
    fontSize: "1.15rem",
    fontWeight: 800,
    color: "#0F172A",
    letterSpacing: "-0.01em",
  },
  cardCategoryBadge: {
    fontSize: "0.75rem",
    fontWeight: 700,
    padding: "0.15rem 0.55rem",
    borderRadius: "12px",
    border: "1px solid",
    display: "inline-flex",
    alignItems: "center",
  },
  cardVerifiedTag: {
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "#065F46",
    background: "#ECFDF5",
    padding: "0.15rem 0.55rem",
    borderRadius: "12px",
    border: "1px solid #A7F3D0",
    display: "inline-flex",
    alignItems: "center",
  },
  cardLocationText: {
    fontSize: "0.82rem",
    color: "#64748B",
    marginTop: "0.1rem",
    display: "flex",
    alignItems: "center",
  },
  cardStatsStrip: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#F8FAFC",
    padding: "0.6rem 0.85rem",
    borderRadius: "12px",
    border: "1px solid #E2E8F0",
  },
  cardStatCell: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
  },
  cardStatValue: {
    fontWeight: 800,
    fontSize: "0.95rem",
    color: "#0F172A",
  },
  cardStatSub: {
    fontSize: "0.7rem",
    color: "#64748B",
    fontWeight: 500,
    marginTop: "0.1rem",
  },
  cardStatDivider: {
    width: "1px",
    height: "22px",
    background: "#E2E8F0",
  },
  cardBioSnippet: {
    fontSize: "0.86rem",
    color: "#475569",
    lineHeight: 1.5,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  cardSkillsPreview: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.4rem",
  },
  cardMiniSkillPill: {
    fontSize: "0.74rem",
    color: "#64748B",
    background: "#F1F5F9",
    padding: "0.2rem 0.55rem",
    borderRadius: "6px",
    fontWeight: 500,
  },
  viewProfileBtn: {
    width: "100%",
    padding: "0.75rem",
    borderRadius: "12px",
    border: "1.5px solid",
    fontWeight: 700,
    fontSize: "0.92rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  outsideAreaCard: {
    background: "white",
    borderRadius: "20px",
    padding: "4rem 2rem",
    textAlign: "center",
    border: "1.5px solid #E2E8F0",
    boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
  },
  supportedAreaBtn: {
    background: "#F8FAFC",
    border: "1.5px solid #CBD5E1",
    padding: "0.5rem 1rem",
    borderRadius: "20px",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#334155",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    transition: "all 0.15s ease",
  },
  emptyStateCard: {
    background: "white",
    borderRadius: "20px",
    padding: "4.5rem 2rem",
    textAlign: "center",
    border: "1.5px solid #E2E8F0",
  },
  resetFilterBtn: {
    background: "var(--primary)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    padding: "0.75rem 1.6rem",
    fontWeight: 700,
    fontSize: "0.92rem",
    cursor: "pointer",
  }
};
