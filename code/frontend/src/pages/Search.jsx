import { useSearchParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
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

const palette = {
  bgPrimary: "#F4F7FC",
  bgSecondary: "#EAF1FA",
  bgSurface: "#FFFFFF",
  bgDark: "#0C1B36",
  textPrimary: "#0F1D38",
  textSecondary: "#56677F",
  textMuted: "#8E9DB2",
  brandPrimary: "#1E4E8C",
  brandSecondary: "#2E62A2",
  brandSoft: "#EEF4FB",
  accent: "#0D9488",
  border: "#D5E1F0",
  borderSubtle: "#E4ECF6",
  success: "#059669",
  warning: "#D97706",
  error: "#DC2626",
};

const categoryColors = {
  Electrician: { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", Icon: Zap },
  Plumber:     { color: "#1E4E8C", bg: "#EEF4FB", border: "#CBDDF2", Icon: Wrench },
  Carpenter:   { color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", Icon: Hammer },
  Painter:     { color: "#DB2777", bg: "#FDF2F8", border: "#FBCFE8", Icon: Paintbrush },
  Cleaning:    { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", Icon: Sparkles },
  "AC Repair": { color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC", Icon: Snowflake },
};

function SkeletonRow() {
  return (
    <div className="sc-search-skeleton" style={{
      minHeight: "218px", padding: "1.25rem", borderRadius: "18px",
      background: "#FFFFFF", border: `1px solid ${palette.borderSubtle}`,
      boxShadow: "0 8px 24px rgba(25, 55, 110, 0.05)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "1.2rem" }}>
        <div style={{ width: 58, height: 58, borderRadius: 15, background: palette.bgSecondary }} />
        <div style={{ flex: 1, display: "grid", gap: "0.55rem" }}>
          <div style={{ height: 14, width: "58%", background: palette.bgSecondary, borderRadius: 6 }} />
          <div style={{ height: 11, width: "38%", background: palette.borderSubtle, borderRadius: 6 }} />
        </div>
      </div>
      <div style={{ height: 11, width: "90%", background: palette.borderSubtle, borderRadius: 6, marginBottom: 9 }} />
      <div style={{ height: 11, width: "65%", background: palette.borderSubtle, borderRadius: 6 }} />
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
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("recommended");
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [hoveredRowId, setHoveredRowId] = useState(null);
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

  const displayedWorkers = useMemo(() => {
    const kw = searchInput.trim().toLowerCase();
    const filtered = workers.filter((w) => {
      if (kw) {
        const matchesKeyword =
          (w.userId?.name || "").toLowerCase().includes(kw) ||
          (w.category || "").toLowerCase().includes(kw) ||
          (w.bio || "").toLowerCase().includes(kw) ||
          (w.skills || []).some((s) => s.toLowerCase().includes(kw));
        if (!matchesKeyword) return false;
      }
      if (maxPrice && Number(w.charges) > Number(maxPrice)) {
        return false;
      }
      if (minRating > 0 && (Number(w.rating) || 0) < minRating) {
        return false;
      }
      return true;
    });

    if (sortBy === "rating_desc") {
      return [...filtered].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    }
    if (sortBy === "price_asc") {
      return [...filtered].sort((a, b) => (Number(a.charges) || 0) - (Number(b.charges) || 0));
    }
    if (sortBy === "price_desc") {
      return [...filtered].sort((a, b) => (Number(b.charges) || 0) - (Number(a.charges) || 0));
    }
    if (sortBy === "exp_desc") {
      return [...filtered].sort((a, b) => (Number(b.experience) || 0) - (Number(a.experience) || 0));
    }
    return filtered;
  }, [workers, searchInput, maxPrice, minRating, sortBy]);

  const hasActiveFilters = Boolean(searchInput.trim() || maxPrice || minRating > 0 || sortBy !== "recommended" || category);

  const selectStyle = {
    padding: "0.55rem 0.9rem",
    background: palette.bgSurface,
    border: `1px solid ${palette.border}`,
    borderRadius: "8px",
    fontSize: "0.86rem",
    color: palette.textPrimary,
    fontWeight: 500,
    cursor: "pointer",
    outline: "none",
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
  };

  return (
    <div
      className="sc-search-page"
      style={{
        background: "transparent",
        minHeight: "100vh",
        paddingBottom: "5rem",
      }}
    >
      <style>{`
        .sc-search-page h1, .sc-search-page h2, .sc-search-page h3, .sc-search-action, .sc-pro-card-cta, .sc-search-filter {
          font-family: 'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif !important;
        }
        .sc-search-inner { width: min(100% - 48px, var(--container-max, 1680px)); margin: 0 auto; padding: 0 clamp(1rem, 2.4vw, 2.5rem); box-sizing: border-box; }
        .sc-search-results { width: min(100% - 48px, var(--container-max, 1680px)); margin: 0 auto; padding: 2rem clamp(1rem, 2.4vw, 2.5rem) 0; box-sizing: border-box; }
        .sc-search-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(1rem, 1.35vw, 1.6rem); align-items: stretch; }
        .sc-professional-card { isolation: isolate; overflow: hidden; background: #FFFFFF !important; border: 1px solid #DCE5F2 !important; box-shadow: 0 4px 18px rgba(14, 27, 51, 0.05), 0 1px 3px rgba(14, 27, 51, 0.02) !important; }
        .sc-professional-card:hover { transform: translateY(-5px) !important; box-shadow: 0 18px 36px rgba(18, 42, 82, .11), 0 4px 12px rgba(18, 42, 82, .05) !important; border-color: #BACEE6 !important; }
        .sc-professional-card:focus-visible { outline: 3px solid rgba(30, 78, 140, .35) !important; outline-offset: 3px; }
        .sc-professional-card img { transition: transform 420ms cubic-bezier(.2,.7,.2,1); }
        .sc-professional-card:hover img { transform: scale(1.075); }
        .sc-pro-card-cover { transition: filter 220ms ease; }
        .sc-professional-card:hover .sc-pro-card-cover { filter: saturate(1.05); }
        .sc-pro-card-cta { transition: transform 180ms ease, box-shadow 180ms ease, background 180ms ease; }
        .sc-pro-card-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 18px rgba(30, 78, 140, .26) !important; }
        .sc-pro-card-cta:active { transform: translateY(0); }
        .sc-search-control { transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease; }
        .sc-search-control:focus-within { border-color: #1E4E8C !important; box-shadow: 0 0 0 3px rgba(30, 78, 140, .12) !important; }
        .sc-search-action { transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease; }
        .sc-search-action:hover { transform: translateY(-1px); box-shadow: 0 8px 18px rgba(30, 78, 140, .22); }
        .sc-search-filter { transition: transform 150ms ease, box-shadow 150ms ease, background 150ms ease; }
        .sc-search-filter:hover { transform: translateY(-2px); box-shadow: 0 6px 14px rgba(30, 78, 140, .12); }
        @media (min-width: 1600px) { .sc-search-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
        @media (max-width: 1100px) { .sc-search-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 680px) { .sc-search-grid { grid-template-columns: minmax(0, 1fr); gap: .9rem; } .sc-search-results { padding: 1.25rem 1rem 0; } }
        @media (prefers-reduced-motion: reduce) { .sc-professional-card, .sc-professional-card img, .sc-search-control, .sc-search-action, .sc-search-filter { transition: none !important; } }
      `}</style>
      {/* Toast */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            background: palette.success,
            color: "white",
            padding: "0.9rem 1.4rem",
            borderRadius: "10px",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            fontSize: "0.92rem",
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(36,43,53,0.18)",
          }}
        >
          <CheckCircle2 size={18} color="white" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage("")}
            style={{
              background: "transparent",
              border: "none",
              color: palette.textPrimary,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              padding: "0.2rem",
            }}
            aria-label="Close notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div
        style={{
          background: "linear-gradient(118deg, #0C1A33 0%, #12284E 58%, #1A386D 100%)",
          color: "#FFFFFF",
          padding: "2.75rem 2rem 2.25rem",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div className="sc-search-inner">
          <h1
            style={{
              fontSize: "2.1rem",
              fontWeight: 800,
              color: "#FFFFFF",
              letterSpacing: "-0.03em",
              margin: "0 0 0.4rem",
              fontFamily: "'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif",
            }}
          >
            Find Professionals
          </h1>
          <p
            style={{
              color: "#C5D5EB",
              fontSize: "0.95rem",
              margin: "0 0 1.75rem",
            }}
          >
            Browse certified local specialists in <strong style={{ color: "#E0ECFB" }}>{location}</strong>. Inspect reviews and fixed pricing before booking.
          </p>

          {/* Search + Location row */}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
            <div
              style={{
                flex: "2 1 240px",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                borderRadius: "8px",
                padding: "0.6rem 1rem",
              }}
            >
              <SearchIcon size={15} color="#64748B" />
              <input
                type="text"
                placeholder="Search by service, skill, or name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  flex: 1,
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: "0.9rem",
                  color: palette.textPrimary,
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                }}
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#64748B",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    padding: 0,
                  }}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <form
              onSubmit={handleLocationSubmit}
              className="sc-search-control"
              style={{
                flex: "1 1 180px",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                borderRadius: "8px",
                padding: "0.4rem 0.5rem 0.4rem 1rem",
              }}
            >
              <MapPin size={15} color="#64748B" />
              <input
                type="text"
                placeholder={`City: ${location}`}
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                style={{
                  flex: 1,
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: "0.9rem",
                  color: palette.textPrimary,
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                }}
              />
              <button
                type="submit"
                className="sc-search-action"
                style={{
                  background: palette.brandPrimary,
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  padding: "0.5rem 0.9rem",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                }}
              >
                Update
              </button>
            </form>
          </div>

          {/* Category pills */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              overflowX: "auto",
              paddingBottom: "0.5rem",
              WebkitOverflowScrolling: "touch",
            }}
          >
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
                  className="sc-search-filter"
                  onClick={() => setCategory(cat.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.45rem 1rem",
                    borderRadius: "100px",
                    border: "1px solid",
                    background: isSelected ? palette.brandPrimary : "rgba(255, 255, 255, 0.09)",
                    borderColor: isSelected ? palette.brandPrimary : "rgba(191, 219, 254, 0.28)",
                    color: isSelected ? "#FFFFFF" : "#DCE8FF",
                    fontSize: "0.82rem",
                    fontWeight: isSelected ? 700 : 500,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 160ms ease",
                    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  }}
                >
                  {CatIcon && <CatIcon size={13} />}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results area */}
      <div className="sc-search-results">
        {/* Filter row + results count */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ fontSize: "0.88rem", color: palette.textSecondary, fontWeight: 600 }}>
            {loading
              ? "Checking availability..."
              : isServiceAreaSupported
              ? `${displayedWorkers.length} professional${displayedWorkers.length !== 1 ? "s" : ""} in ${location}`
              : `Coverage notice for ${location}`}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            <select
              aria-label="Filter by max hourly price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              style={selectStyle}
            >
              <option value="">Any Price</option>
              <option value="500">Under ₹500/hr</option>
              <option value="1000">Under ₹1,000/hr</option>
              <option value="2000">Under ₹2,000/hr</option>
            </select>

            <select
              aria-label="Filter by minimum rating"
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              style={selectStyle}
            >
              <option value={0}>Any Rating</option>
              <option value={4}>4.0+ Stars</option>
              <option value={4.5}>4.5+ Stars</option>
            </select>

            <select
              aria-label="Sort professionals"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={selectStyle}
            >
              <option value="recommended">Recommended</option>
              <option value="rating_desc">Top Rated</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="exp_desc">Most Experienced</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setCategory("");
                  setMaxPrice("");
                  setMinRating(0);
                  setSortBy("recommended");
                }}
                style={{
                  padding: "0.5rem 0.85rem",
                  borderRadius: "8px",
                  border: `1px solid ${palette.border}`,
                  background: "transparent",
                  color: palette.textSecondary,
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                }}
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {!isServiceAreaSupported ? (
          /* Outside service area */
          <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
            <MapPin size={40} color={palette.textMuted} style={{ marginBottom: "1rem" }} />
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: palette.textPrimary,
                marginBottom: "0.5rem",
              }}
            >
              ServeConnect isn't in your area yet
            </h2>
            <p
              style={{
                color: palette.textSecondary,
                maxWidth: "480px",
                margin: "0 auto 1.75rem",
                fontSize: "0.95rem",
                lineHeight: 1.6,
              }}
            >
              We're actively growing to <strong>{location}</strong>. Try a nearby city or check back soon.
            </p>

            <div style={{ marginBottom: "1.5rem" }}>
              <div
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: palette.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "0.75rem",
                }}
              >
                Active Cities
              </div>
              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}>
                {supportedCitiesList.map((c) => (
                  <button
                    key={c}
                    onClick={() => setLocation(c)}
                    style={{
                      background: palette.bgSurface,
                      border: `1px solid ${palette.border}`,
                      padding: "0.5rem 1rem",
                      borderRadius: "100px",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      color: palette.textPrimary,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                    }}
                  >
                    <MapPin size={12} color={palette.brandPrimary} />
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => setLocation("Patiala")}
                style={{
                  padding: "0.7rem 1.5rem",
                  borderRadius: "8px",
                  background: palette.brandPrimary,
                  color: "white",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                }}
              >
                Switch to Patiala
              </button>
              <button
                onClick={() => {
                  setNotified(true);
                  setTimeout(() => setNotified(false), 4000);
                }}
                style={{
                  padding: "0.7rem 1.5rem",
                  borderRadius: "8px",
                  background: "transparent",
                  color: palette.brandPrimary,
                  border: `1px solid ${palette.brandPrimary}`,
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                }}
              >
                {notified ? (
                  <><Check size={16} /><span>We'll notify you!</span></>
                ) : (
                  <><Bell size={16} /><span>Notify Me</span></>
                )}
              </button>
            </div>
          </div>
        ) : loading ? (
          /* Skeleton rows */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: "1.1rem" }}>
            {[1, 2, 3, 4, 5, 6].map((n) => <SkeletonRow key={n} />)}
          </div>
        ) : displayedWorkers.length === 0 ? (
          /* Empty state */
          <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
            <SearchIcon size={40} color={palette.textMuted} style={{ marginBottom: "1rem" }} />
            <h3
              style={{
                fontSize: "1.3rem",
                fontWeight: 800,
                color: palette.textPrimary,
                marginBottom: "0.5rem",
              }}
            >
              No professionals found
            </h3>
            <p
              style={{
                color: palette.textSecondary,
                maxWidth: "420px",
                margin: "0 auto 1.5rem",
                fontSize: "0.92rem",
                lineHeight: 1.55,
              }}
            >
              Try clearing your filters or selecting "All Services" to see everyone available.
            </p>
            <button
              onClick={() => {
                setCategory("");
                setSearchInput("");
                setMaxPrice("");
                setMinRating(0);
                setSortBy("recommended");
              }}
              style={{
                padding: "0.7rem 1.5rem",
                background: palette.brandPrimary,
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              }}
            >
              Reset Filters & Show All
            </button>
          </div>
        ) : (
          /* Professional profile cards */
          <div className="sc-search-grid">
            {displayedWorkers.map((worker) => {
              const sc = categoryColors[worker.category] || {
                color: palette.brandPrimary,
                bg: palette.brandSoft,
                border: palette.border,
                Icon: BriefcaseBusiness,
              };
              const CatIcon = sc.Icon;
              const isHovered = hoveredRowId === worker._id;
              const name = worker.userId?.name || "Verified Professional";

              return (
                <article
                  className="sc-professional-card"
                  key={worker._id}
                  onMouseEnter={() => setHoveredRowId(worker._id)}
                  onMouseLeave={() => setHoveredRowId(null)}
                  onClick={() => setSelectedWorker(worker)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedWorker(worker);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View profile and book ${name}`}
                  style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: "350px",
                    borderRadius: "20px",
                    border: `1px solid ${isHovered ? "#A9C5FF" : palette.border}`,
                    background: "#FFFFFF",
                    boxShadow: isHovered
                      ? "0 24px 48px rgba(30, 78, 140, .14), 0 6px 16px rgba(20,42,85,.06)"
                      : "0 8px 24px rgba(25, 55, 110, .055)",
                    transform: isHovered ? "translateY(-7px)" : "translateY(0)",
                    transition: "transform 240ms cubic-bezier(.2,.8,.2,1), box-shadow 240ms ease, border-color 240ms ease",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  <div
                    className="sc-pro-card-cover"
                    style={{
                      height: "94px",
                      flexShrink: 0,
                      position: "relative",
                      background: `linear-gradient(125deg, ${sc.bg} 0%, #F7FAFF 58%, #EAF1FF 100%)`,
                      borderBottom: `1px solid ${sc.border}`,
                    }}
                  >
                    <div style={{ position: "absolute", left: "1.25rem", top: "1rem", display: "inline-flex", alignItems: "center", gap: ".4rem", padding: ".35rem .65rem", borderRadius: "999px", background: "rgba(255,255,255,.88)", border: `1px solid ${sc.border}`, color: sc.color, fontSize: ".72rem", fontWeight: 750, fontFamily: "'Outfit', sans-serif" }}>
                      <CatIcon size={12} /> {worker.category || "Home Services"}
                    </div>
                    <div style={{ position: "absolute", right: "1.15rem", top: ".9rem", display: "inline-flex", alignItems: "center", gap: ".25rem", padding: ".38rem .58rem", borderRadius: "9px", background: "#FFFFFF", color: "#A16207", boxShadow: "0 3px 10px rgba(15,23,42,.06)", fontWeight: 800, fontSize: ".8rem", fontFamily: "'Outfit', sans-serif" }}>
                      <Star size={13} fill="#F59E0B" color="#F59E0B" />
                      {Number(worker.rating) > 0 ? Number(worker.rating).toFixed(1) : "New"}
                    </div>
                  </div>

                  <div style={{ padding: "0 1.25rem 1.15rem", display: "flex", flexDirection: "column", flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: ".75rem", marginTop: "-35px", marginBottom: ".8rem" }}>
                      <div style={{ width: 76, height: 76, borderRadius: "19px", flexShrink: 0, overflow: "hidden", display: "grid", placeItems: "center", background: sc.bg, color: sc.color, border: "4px solid #FFFFFF", boxShadow: "0 5px 16px rgba(15,23,42,.12)", fontWeight: 850, fontSize: "1.45rem", fontFamily: "'Outfit', sans-serif" }}>
                        {worker.photo ? (
                          <img src={worker.photo} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                        ) : name.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: ".3rem", color: "#1E4E8C", background: "#EEF4FB", border: "1px solid #CBDDF2", borderRadius: "999px", padding: ".34rem .58rem", fontSize: ".69rem", fontWeight: 750, marginBottom: ".15rem", fontFamily: "'Outfit', sans-serif" }}>
                        <BadgeCheck size={13} /> Approved professional
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: ".4rem", marginBottom: ".3rem", minWidth: 0 }}>
                      <h3 style={{ margin: 0, color: palette.textPrimary, fontSize: "1.08rem", fontWeight: 850, letterSpacing: "-.025em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif" }}>{name}</h3>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: ".35rem", color: palette.textMuted, fontSize: ".79rem", marginBottom: ".85rem" }}>
                      <MapPin size={13} color={palette.brandSecondary} />
                      <span>{worker.location || "Service Area"}</span>
                      {worker.experience !== undefined && worker.experience !== null && worker.experience !== "" && (
                        <><span style={{ color: "#CBD5E1", margin: "0 .15rem" }}>•</span><BriefcaseBusiness size={12} color={palette.brandSecondary} /><span>{worker.experience} yrs experience</span></>
                      )}
                    </div>

                    <p style={{
                      color: palette.textSecondary,
                      fontSize: ".84rem",
                      lineHeight: 1.62,
                      margin: "0 0 1.15rem",
                      minHeight: "2.7em",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}>
                      {worker.bio || `Experienced ${worker.category || "home service"} professional ready to help with your home service needs.`}
                    </p>

                    <div style={{ marginTop: "auto", paddingTop: ".95rem", borderTop: `1px solid ${palette.borderSubtle}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: ".75rem" }}>
                      <div>
                        <div style={{ color: palette.textMuted, fontSize: ".67rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: ".18rem", fontFamily: "'Outfit', sans-serif" }}>Starting rate</div>
                        <div style={{ color: palette.textPrimary, fontSize: "1.2rem", fontWeight: 900, letterSpacing: "-.035em", fontFamily: "'Outfit', sans-serif" }}>₹{worker.charges || 0}<span style={{ color: palette.textMuted, fontSize: ".75rem", fontWeight: 650 }}>/hr</span></div>
                      </div>
                      <button
                        type="button"
                        className="sc-search-action sc-pro-card-cta"
                        onClick={(e) => { e.stopPropagation(); setSelectedWorker(worker); }}
                        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: ".45rem", padding: ".72rem 1.05rem", borderRadius: "10px", border: "1px solid #1A447A", background: "linear-gradient(135deg, #1E4E8C, #2A64AC)", color: "#FFFFFF", fontSize: ".82rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 14px rgba(30, 78, 140, .22)", fontFamily: "'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif" }}
                      >
                        View profile <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Profile modal */}
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
