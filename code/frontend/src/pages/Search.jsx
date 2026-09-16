import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { getWorkers } from "../services/workerService";
import { createBooking } from "../services/bookingService";
import { useAuth } from "../context/AuthContext";
import { useLocationState } from "../context/LocationContext";

const categoryColors = {
  Electrician: { color: "#F59E0B", bg: "#FFFBEB" },
  Plumber:     { color: "#3B82F6", bg: "#EFF6FF" },
  Carpenter:   { color: "#8B5CF6", bg: "#F5F3FF" },
  Painter:     { color: "#EC4899", bg: "#FDF2F8" },
  Cleaning:    { color: "#10B981", bg: "#ECFDF5" },
  "AC Repair": { color: "#06B6D4", bg: "#ECFEFF" },
};

function StarRating({ rating }) {
  const r = parseFloat(rating) || 4.5;
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "#D97706", fontWeight: 700 }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      {r.toFixed(1)}
    </span>
  );
}

function Search() {
  const [searchParams] = useSearchParams();
  const { token, isAuthenticated } = useAuth();
  const { location } = useLocationState();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [bookingWorkerId, setBookingWorkerId] = useState(null);
  const [bookingData, setBookingData] = useState({ date: "", time: "", notes: "" });
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const searchLoc =
        location === "Detecting..." || location === "Location Error" || location === "Location Denied"
          ? ""
          : location;
      const data = await getWorkers(category, searchLoc);
      setWorkers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [searchParams, location, category]);

  const handleBook = async (workerId) => {
    if (!isAuthenticated) {
      alert("Please login to book a service.");
      return;
    }
    if (!bookingData.date || !bookingData.time) {
      alert("Please select a date and time.");
      return;
    }
    try {
      await createBooking(token, { workerId, ...bookingData });
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingWorkerId(null);
        setBookingData({ date: "", time: "", notes: "" });
        setBookingSuccess(false);
      }, 2000);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div style={{ background: "#f8faff", minHeight: "100vh" }}>

      {/* ── Search Header ── */}
      <div style={{ background: "white", borderBottom: "1px solid var(--border)", padding: "2.5rem 5%" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <p style={{ fontSize: "0.8rem", fontWeight: 700, letterSpacing: "1.5px", color: "var(--primary)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            ServeConnect Directory
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1.5rem" }}>
            <div>
              <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#1a1a2e", marginBottom: "0.25rem" }}>
                Find a Professional
              </h1>
              <p style={{ color: "var(--text-muted)" }}>
                Showing verified workers in <strong>{location}</strong>
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ position: "relative" }}>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ appearance: "none", background: "white", border: "1.5px solid var(--border)", borderRadius: "10px", padding: "0.65rem 2.5rem 0.65rem 1rem", fontSize: "0.95rem", fontWeight: 500, color: "#1a1a2e", cursor: "pointer", outline: "none" }}
                >
                  <option value="">All Services</option>
                  <option value="Electrician">Electrician</option>
                  <option value="Plumber">Plumber</option>
                  <option value="Carpenter">Carpenter</option>
                  <option value="Painter">Painter</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="AC Repair">AC Repair</option>
                </select>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#9ca3af" }}>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              <button
                className="btn btn-primary"
                onClick={fetchWorkers}
                style={{ borderRadius: "10px", padding: "0.65rem 1.5rem" }}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "2rem 5%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            {loading ? "Loading..." : `${workers.length} professional${workers.length !== 1 ? "s" : ""} found`}
          </p>
          {category && (
            <button onClick={() => setCategory("")} style={{ background: "#EFF6FF", color: "var(--primary)", border: "none", borderRadius: "20px", padding: "0.35rem 0.9rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              {category}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "5rem", color: "var(--text-muted)" }}>
            <div style={{ width: "40px", height: "40px", border: "3px solid #e5e7eb", borderTop: "3px solid var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
            Loading professionals...
          </div>
        ) : workers.length === 0 ? (
          <div style={{ background: "white", borderRadius: "16px", border: "1px solid var(--border)", padding: "5rem 2rem", textAlign: "center" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" style={{ margin: "0 auto 1rem" }}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <h3 style={{ color: "#1a1a2e", marginBottom: "0.5rem" }}>No professionals found</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Try changing your location in the navbar or selecting a different service.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: "1.5rem" }}>
            {workers.map((worker) => {
              const sc = categoryColors[worker.category] || { color: "#6B7280", bg: "#F9FAFB" };
              const isOpen = bookingWorkerId === worker._id;
              return (
                <div key={worker._id} style={{ background: "white", borderRadius: "16px", border: "1px solid var(--border)", overflow: "hidden", transition: "box-shadow 0.2s, transform 0.2s", boxShadow: isOpen ? "0 8px 30px rgba(0,0,0,0.1)" : "0 1px 4px rgba(0,0,0,0.04)" }}
                  onMouseEnter={e => { if (!isOpen) { e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}}
                  onMouseLeave={e => { if (!isOpen) { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; e.currentTarget.style.transform = "none"; }}}
                >
                  {/* Top color bar */}
                  <div style={{ height: "3px", background: sc.color }} />

                  <div style={{ padding: "1.5rem" }}>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                        <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: sc.bg, color: sc.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", fontWeight: 800, flexShrink: 0 }}>
                          {worker.userId?.name?.charAt(0) || "P"}
                        </div>
                        <div>
                          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1a1a2e", marginBottom: "0.15rem" }}>
                            {worker.userId?.name || "Professional"}
                          </h3>
                          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: sc.color, background: sc.bg, padding: "0.15rem 0.6rem", borderRadius: "20px" }}>
                            {worker.category}
                          </span>
                        </div>
                      </div>
                      <span style={{ background: "#ECFDF5", color: "#065F46", fontSize: "0.72rem", fontWeight: 700, padding: "0.25rem 0.65rem", borderRadius: "20px", display: "flex", alignItems: "center", gap: "0.3rem", whiteSpace: "nowrap" }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polyline points="20 6 9 17 4 12" /></svg>
                        Verified
                      </span>
                    </div>

                    {/* Details row */}
                    <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem" }}>
                      <div style={{ flex: 1, background: "#f9fafb", borderRadius: "10px", padding: "0.6rem 0.75rem", textAlign: "center" }}>
                        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1a1a2e" }}>{worker.experience}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>Yrs Exp.</div>
                      </div>
                      <div style={{ flex: 1, background: "#f9fafb", borderRadius: "10px", padding: "0.6rem 0.75rem", textAlign: "center" }}>
                        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1a1a2e" }}>₹{worker.charges}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>Per Hour</div>
                      </div>
                      <div style={{ flex: 1, background: "#f9fafb", borderRadius: "10px", padding: "0.6rem 0.75rem", textAlign: "center" }}>
                        <div style={{ display: "flex", justifyContent: "center" }}><StarRating rating={worker.rating} /></div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>Rating</div>
                      </div>
                    </div>

                    {/* Booking Section */}
                    {isOpen ? (
                      <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
                        {bookingSuccess ? (
                          <div style={{ textAlign: "center", padding: "1rem", background: "#ECFDF5", borderRadius: "10px", color: "#065F46", fontWeight: 600 }}>
                            Booking confirmed! Check My Bookings.
                          </div>
                        ) : (
                          <>
                            <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", marginBottom: "0.75rem" }}>Select Date & Time</p>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "0.6rem" }}>
                              <input type="date" value={bookingData.date} onChange={e => setBookingData({ ...bookingData, date: e.target.value })}
                                style={{ padding: "0.65rem", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "0.9rem", outline: "none", width: "100%" }} />
                              <input type="time" value={bookingData.time} onChange={e => setBookingData({ ...bookingData, time: e.target.value })}
                                style={{ padding: "0.65rem", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "0.9rem", outline: "none", width: "100%" }} />
                            </div>
                            <input type="text" placeholder="Any notes for the professional? (optional)" value={bookingData.notes}
                              onChange={e => setBookingData({ ...bookingData, notes: e.target.value })}
                              style={{ padding: "0.65rem", border: "1.5px solid var(--border)", borderRadius: "8px", fontSize: "0.9rem", outline: "none", width: "100%", marginBottom: "0.75rem", boxSizing: "border-box" }} />
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
                              <button onClick={() => handleBook(worker._id)} style={{ padding: "0.75rem", background: "var(--primary)", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" }}>
                                Confirm Booking
                              </button>
                              <button onClick={() => { setBookingWorkerId(null); setBookingData({ date: "", time: "", notes: "" }); }}
                                style={{ padding: "0.75rem", background: "white", color: "#374151", border: "1.5px solid var(--border)", borderRadius: "8px", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}>
                                Cancel
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setBookingWorkerId(worker._id)}
                        style={{ width: "100%", padding: "0.75rem", background: "var(--primary)", color: "white", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer", fontSize: "0.95rem", transition: "background 0.2s" }}
                        onMouseEnter={e => e.target.style.background = "#1D4ED8"}
                        onMouseLeave={e => e.target.style.background = "var(--primary)"}
                      >
                        Book Now
                      </button>
                    )}
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

export default Search;
