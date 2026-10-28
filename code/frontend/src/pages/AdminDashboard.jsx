import { useState, useEffect, useMemo } from "react";
import {
  getAllWorkers,
  getAdminStats,
  approveWorker,
  rejectWorker,
  getWorkerDetails,
} from "../services/adminService";
import { useAuth } from "../context/AuthContext";
import AdminWorkerReviewModal from "../components/AdminWorkerReviewModal";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Check,
  X,
  ShieldCheck,
  Search,
  Filter,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
  Eye,
  IndianRupee,
  MapPin,
  CalendarDays,
  BriefcaseBusiness,
  AlertCircle,
  Zap,
  Wrench,
  Hammer,
  Paintbrush,
  Snowflake,
} from "lucide-react";

const categoryTheme = {
  Electrician: { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", Icon: Zap },
  Plumber:     { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE", Icon: Wrench },
  Carpenter:   { color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE", Icon: Hammer },
  Painter:     { color: "#DB2777", bg: "#FDF2F8", border: "#FBCFE8", Icon: Paintbrush },
  Cleaning:    { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0", Icon: Sparkles },
  "AC Repair": { color: "#0891B2", bg: "#ECFEFF", border: "#A5F3FC", Icon: Snowflake },
};

function formatSubmissionDate(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const now = Date.now();
  const diffHours = Math.floor((now - d.getTime()) / (1000 * 60 * 60));

  let rel = "";
  if (diffHours < 1) rel = "Just now";
  else if (diffHours < 24) rel = `${diffHours}h ago`;
  else {
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) rel = "Yesterday";
    else if (diffDays < 7) rel = `${diffDays}d ago`;
    else rel = d.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  return {
    formatted: d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }),
    relative: rel
  };
}

export default function AdminDashboard() {
  const { token } = useAuth();

  const [workers, setWorkers] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search state
  const [activeStatusFilter, setActiveStatusFilter] = useState("pending"); // Default to 'pending' to review new apps first
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOption, setSortOption] = useState("newest"); // newest, oldest, charges_high, charges_low

  // Selected worker for Review Modal
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Load stats & workers
  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    if (!token) {
      if (isManualRefresh) {
        showToast("Please log in as an administrator to load dashboard records.", "error");
      }
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      // 1. Fetch worker applications (the core data)
      const workersData = await getAllWorkers(token, { sort: sortOption });
      const workersList = Array.isArray(workersData) ? workersData : [];
      setWorkers(workersList);

      // Compute immediate stats from workers list
      const computedStats = {
        total: workersList.length,
        pending: workersList.filter((w) => (w.status || "pending") === "pending").length,
        approved: workersList.filter((w) => w.status === "approved").length,
        rejected: workersList.filter((w) => w.status === "rejected").length,
      };

      // 2. Try fetching server-side stats if endpoint exists, fallback cleanly to computed stats
      try {
        const statsData = await getAdminStats(token);
        if (statsData && typeof statsData.total === "number") {
          setStats(statsData);
        } else {
          setStats(computedStats);
        }
      } catch (statsErr) {
        console.warn("Could not fetch /api/admin/stats, using computed stats:", statsErr.message);
        setStats(computedStats);
      }

      if (isManualRefresh) {
        showToast("Records refreshed successfully.", "success");
      }
    } catch (err) {
      console.error("Admin dashboard load error:", err);
      showToast(err.message || "Failed to load dashboard data. Please check your backend connection.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Open full details modal (fetches live reviews & documents)
  const handleOpenReviewModal = async (worker) => {
    try {
      const fullDetails = await getWorkerDetails(worker._id, token);
      setSelectedWorker(fullDetails);
    } catch {
      // Fallback to table object if fetch fails
      setSelectedWorker(worker);
    }
  };

  // Handle Approve
  const handleApprove = async (workerId) => {
    setActionLoading(true);
    try {
      const res = await approveWorker(workerId, token);
      showToast(`Worker application approved! Automated email notification sent to ${res.worker?.userId?.email || "worker"}.`, "success");

      // Update in-place in local state
      setWorkers((prev) =>
        prev.map((w) => (w._id === workerId ? { ...w, status: "approved", reviewedAt: new Date() } : w))
      );

      // Refresh stats locally immediately
      setStats((prev) => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        approved: prev.approved + 1,
      }));

      // Background sync with server stats
      getAdminStats(token).then((s) => s && setStats(s)).catch(() => {});

      // Update selected worker modal if open
      if (selectedWorker?._id === workerId) {
        setSelectedWorker((prev) => ({ ...prev, status: "approved", reviewedAt: new Date() }));
      }
    } catch (err) {
      showToast(err.message || "Failed to approve application.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject
  const handleReject = async (workerId, reason = "") => {
    setActionLoading(true);
    try {
      const res = await rejectWorker(workerId, token, reason);
      showToast(`Worker application declined. Rejection notification sent to ${res.worker?.userId?.email || "worker"}.`, "info");

      // Update in-place in local state
      setWorkers((prev) =>
        prev.map((w) =>
          w._id === workerId
            ? { ...w, status: "rejected", rejectionReason: reason, reviewedAt: new Date() }
            : w
        )
      );

      // Refresh stats locally immediately
      setStats((prev) => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        rejected: prev.rejected + 1,
      }));

      // Background sync with server stats
      getAdminStats(token).then((s) => s && setStats(s)).catch(() => {});

      // Update selected worker modal if open
      if (selectedWorker?._id === workerId) {
        setSelectedWorker((prev) => ({
          ...prev,
          status: "rejected",
          rejectionReason: reason,
          reviewedAt: new Date(),
        }));
      }
    } catch (err) {
      showToast(err.message || "Failed to reject application.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter and sort workers on the frontend
  const filteredAndSortedWorkers = useMemo(() => {
    let list = [...workers];

    // Filter by Status
    if (activeStatusFilter !== "all") {
      list = list.filter((w) => w.status === activeStatusFilter);
    }

    // Filter by Category
    if (selectedCategory !== "all") {
      list = list.filter((w) => (w.category || "").toLowerCase() === selectedCategory.toLowerCase());
    }

    // Filter by Search Query (Name, Email, Location, Category, Phone)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((w) => {
        const name = (w.userId?.name || "").toLowerCase();
        const email = (w.userId?.email || "").toLowerCase();
        const phone = (w.phone || w.userId?.phone || "").toLowerCase();
        const loc = (w.location || "").toLowerCase();
        const cat = (w.category || "").toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q) || loc.includes(q) || cat.includes(q);
      });
    }

    // Sort: Default Newest First by createdAt
    list.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      if (sortOption === "newest") {
        return timeB - timeA; // Descending
      } else if (sortOption === "oldest") {
        return timeA - timeB; // Ascending
      } else if (sortOption === "charges_high") {
        return (b.charges || 0) - (a.charges || 0);
      } else if (sortOption === "charges_low") {
        return (a.charges || 0) - (b.charges || 0);
      }
      return timeB - timeA;
    });

    return list;
  }, [workers, activeStatusFilter, selectedCategory, searchQuery, sortOption]);

  const categoriesList = ["Electrician", "Plumber", "Carpenter", "Painter", "Cleaning", "AC Repair"];

  return (
    <div className="page admin-page" style={{ maxWidth: "1280px", margin: "0 auto", padding: "2.5rem 1.5rem 5rem" }}>
      
      {/* Toast Banner */}
      {toast && (
        <div
          style={{
            ...styles.toastNotice,
            background: toast.type === "error" ? "#EF4444" : toast.type === "info" ? "#3B82F6" : "#10B981"
          }}
          className="animate-slide-up"
        >
          {toast.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} style={styles.toastCloseBtn}>✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div style={styles.headerRow}>
        <div>
          <div style={styles.sectionBadge}>
            <ShieldCheck size={13} style={{ marginRight: "0.3rem" }} />
            <span>ADMINISTRATOR VERIFICATION CONSOLE</span>
          </div>
          <h1 style={styles.mainTitle}>Worker Verification & Applications</h1>
          <p style={{ color: "#64748B", fontSize: "0.95rem", margin: "0.35rem 0 0" }}>
            Review incoming registration applications, inspect applicant portfolios & credentials, and approve verified service partners.
          </p>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          style={styles.refreshBtn}
          title="Reload newest records from database"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          <span>{refreshing ? "Refreshing..." : "Refresh Records"}</span>
        </button>
      </div>

      {/* ── Key Metrics Cards ── */}
      <div className="admin-stats" style={styles.statsGrid}>
        <div
          style={{
            ...styles.statCard,
            borderColor: activeStatusFilter === "all" ? "var(--primary)" : "#E2E8F0",
            background: activeStatusFilter === "all" ? "#EFF6FF" : "white",
          }}
          onClick={() => setActiveStatusFilter("all")}
          role="button"
          tabIndex={0}
          title="Click to view all applications"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={styles.statLabel}>Total Applications</span>
            <CalendarDays size={18} color="#2563EB" />
          </div>
          <strong style={{ fontSize: "1.9rem", color: "#0F172A" }}>{stats.total}</strong>
          <div style={styles.statHint}>All lifetime submissions</div>
        </div>

        <div
          style={{
            ...styles.statCard,
            borderColor: activeStatusFilter === "pending" ? "#F59E0B" : "#E2E8F0",
            background: activeStatusFilter === "pending" ? "#FFFBEB" : "white",
          }}
          onClick={() => setActiveStatusFilter("pending")}
          role="button"
          tabIndex={0}
          title="Click to view pending reviews"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ ...styles.statLabel, color: "#B45309" }}>Pending Review</span>
            <Clock size={18} color="#D97706" />
          </div>
          <strong style={{ fontSize: "1.9rem", color: "#D97706" }}>{stats.pending}</strong>
          <div style={{ ...styles.statHint, color: "#B45309" }}>Needs admin attention</div>
        </div>

        <div
          style={{
            ...styles.statCard,
            borderColor: activeStatusFilter === "approved" ? "#10B981" : "#E2E8F0",
            background: activeStatusFilter === "approved" ? "#F0FDF4" : "white",
          }}
          onClick={() => setActiveStatusFilter("approved")}
          role="button"
          tabIndex={0}
          title="Click to view approved partners"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ ...styles.statLabel, color: "#047857" }}>Approved Partners</span>
            <CheckCircle2 size={18} color="#059669" />
          </div>
          <strong style={{ fontSize: "1.9rem", color: "#059669" }}>{stats.approved}</strong>
          <div style={{ ...styles.statHint, color: "#047857" }}>Live in marketplace</div>
        </div>

        <div
          style={{
            ...styles.statCard,
            borderColor: activeStatusFilter === "rejected" ? "#EF4444" : "#E2E8F0",
            background: activeStatusFilter === "rejected" ? "#FEF2F2" : "white",
          }}
          onClick={() => setActiveStatusFilter("rejected")}
          role="button"
          tabIndex={0}
          title="Click to view declined applications"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ ...styles.statLabel, color: "#991B1B" }}>Declined</span>
            <XCircle size={18} color="#DC2626" />
          </div>
          <strong style={{ fontSize: "1.9rem", color: "#DC2626" }}>{stats.rejected}</strong>
          <div style={{ ...styles.statHint, color: "#991B1B" }}>Requirements not met</div>
        </div>
      </div>

      {/* ── Filter Tabs & Search Control Strip ── */}
      <div style={styles.controlsWrapper}>
        
        {/* Status Filter Pills */}
        <div style={styles.filterPillsRow}>
          {[
            { id: "pending", label: "Pending Review", count: stats.pending, color: "#D97706" },
            { id: "all", label: "All Applications", count: stats.total, color: "#2563EB" },
            { id: "approved", label: "Approved", count: stats.approved, color: "#059669" },
            { id: "rejected", label: "Declined", count: stats.rejected, color: "#DC2626" },
          ].map((tab) => {
            const isSelected = activeStatusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveStatusFilter(tab.id)}
                style={{
                  ...styles.statusFilterBtn,
                  background: isSelected ? "var(--primary)" : "white",
                  color: isSelected ? "white" : "#475569",
                  borderColor: isSelected ? "var(--primary)" : "#E2E8F0",
                  fontWeight: isSelected ? 700 : 500,
                  boxShadow: isSelected ? "0 4px 12px rgba(37,99,235,0.2)" : "none"
                }}
              >
                <span>{tab.label}</span>
                <span style={{
                  ...styles.pillCount,
                  background: isSelected ? "rgba(255,255,255,0.25)" : "#F1F5F9",
                  color: isSelected ? "white" : "#64748B"
                }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Selectors Strip */}
        <div style={styles.searchAndSelectorsStrip}>
          
          {/* Keyword Search Input */}
          <div style={styles.searchBox}>
            <Search size={16} color="#64748B" />
            <input
              type="text"
              placeholder="Search by worker name, email, phone, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", display: "flex", alignItems: "center" }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div style={styles.dropdownWrap}>
            <Filter size={14} color="#64748B" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={styles.selectInput}
              aria-label="Filter by service category"
            >
              <option value="all">All Service Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div style={styles.dropdownWrap}>
            <ArrowUpDown size={14} color="#64748B" />
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              style={styles.selectInput}
              aria-label="Sort applications"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="charges_high">Hourly Rate: High to Low</option>
              <option value="charges_low">Hourly Rate: Low to High</option>
            </select>
          </div>

        </div>

      </div>

      {/* ── Applications Table Card ── */}
      <div style={styles.tableCardContainer}>
        
        <div style={styles.tableHeaderBar}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>
              {activeStatusFilter === "pending"
                ? "Pending Applications Requiring Verification"
                : activeStatusFilter === "approved"
                ? "Active Verified Service Professionals"
                : activeStatusFilter === "rejected"
                ? "Declined Partner Applications"
                : "All Worker Registrations"}
            </h3>
            <span style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: 600 }}>
              ({filteredAndSortedWorkers.length} {filteredAndSortedWorkers.length === 1 ? "applicant" : "applicants"})
            </span>
          </div>

          <span style={{ fontSize: "0.78rem", color: "#64748B" }}>
            Click any row to open the complete inspection profile card
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
            <div style={styles.spinner} />
            <p style={{ marginTop: "1.25rem", color: "#64748B", fontWeight: 600 }}>
              Loading real-time application database...
            </p>
          </div>
        ) : filteredAndSortedWorkers.length === 0 ? (
          <div style={styles.emptyTableState}>
            <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
              <ShieldCheck size={48} color="#94A3B8" />
            </div>
            <h4 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1E293B", marginBottom: "0.35rem" }}>
              {activeStatusFilter === "pending" && !searchQuery
                ? "All caught up! No pending applications to review"
                : "No worker applications matching current filters"}
            </h4>
            <p style={{ color: "#64748B", fontSize: "0.9rem", maxWidth: "460px", margin: "0 auto 1.25rem", lineHeight: 1.5 }}>
              {activeStatusFilter === "pending" && !searchQuery
                ? "New registrations will appear at the top of this list as soon as professionals register on ServeConnect."
                : "Try clearing your search query, selecting 'All Service Categories', or resetting your status filter."}
            </p>
            {(searchQuery || selectedCategory !== "all" || activeStatusFilter !== "pending") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setActiveStatusFilter("all");
                }}
                style={styles.resetBtn}
              >
                Reset Filters & Show All
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Applicant</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Experience</th>
                  <th style={styles.th}>Hourly Rate</th>
                  <th style={styles.th}>Location</th>
                  <th style={styles.th}>Submission Time</th>
                  <th style={styles.th}>Status</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredAndSortedWorkers.map((worker) => {
                  const cat = categoryTheme[worker.category] || {
                    color: "#2563EB",
                    bg: "#EFF6FF",
                    border: "#BFDBFE",
                    Icon: BriefcaseBusiness,
                  };
                  const CatIcon = cat.Icon;

                  const isPending = worker.status === "pending";
                  const isApproved = worker.status === "approved";
                  const isRejected = worker.status === "rejected";

                  const subTime = formatSubmissionDate(worker.createdAt);
                  const isRecentlySubmitted =
                    isPending &&
                    worker.createdAt &&
                    Date.now() - new Date(worker.createdAt).getTime() < 1000 * 60 * 60 * 72;

                  return (
                    <tr
                      key={worker._id}
                      onClick={() => handleOpenReviewModal(worker)}
                      style={styles.tableRow}
                      tabIndex={0}
                      role="button"
                      aria-label={`Open review card for ${worker.userId?.name || "Applicant"}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleOpenReviewModal(worker);
                        }
                      }}
                    >
                      {/* 1. Worker Identity */}
                      <td style={styles.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                          <div style={styles.rowAvatar}>
                            {worker.photo ? (
                              <img
                                src={worker.photo}
                                alt={worker.userId?.name || "Worker"}
                                style={styles.rowAvatarImg}
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  if (e.target.nextSibling) e.target.nextSibling.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              style={{
                                ...styles.rowAvatarFallback,
                                background: `linear-gradient(135deg, ${cat.color}, #1E40AF)`,
                                display: worker.photo ? "none" : "flex",
                              }}
                            >
                              {worker.userId?.name?.charAt(0) || "W"}
                            </div>
                          </div>

                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                              <strong style={{ color: "#0F172A", fontSize: "0.95rem" }}>
                                {worker.userId?.name || "Unknown Applicant"}
                              </strong>
                              {isRecentlySubmitted && (
                                <span style={styles.rowNewBadge}>
                                  <Sparkles size={9} /> NEW
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "0.78rem", color: "#64748B", marginTop: "0.15rem" }}>
                              {worker.userId?.email || "No email on record"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Category */}
                      <td style={styles.td}>
                        <span style={{ ...styles.categoryBadge, background: cat.bg, color: cat.color, borderColor: cat.border }}>
                          <CatIcon size={12} style={{ marginRight: "0.25rem" }} />
                          <span>{worker.category || "General"}</span>
                        </span>
                      </td>

                      {/* 3. Experience */}
                      <td style={styles.td}>
                        <span style={{ fontWeight: 600, color: "#1E293B", fontSize: "0.9rem" }}>
                          {worker.experience || 0} years
                        </span>
                      </td>

                      {/* 4. Charges */}
                      <td style={styles.td}>
                        <span style={{ fontWeight: 800, color: "#2563EB", fontSize: "0.95rem", display: "inline-flex", alignItems: "center" }}>
                          <IndianRupee size={13} />
                          <span>{worker.charges || 300}</span>
                          <span style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 500 }}>/hr</span>
                        </span>
                      </td>

                      {/* 5. Location */}
                      <td style={styles.td}>
                        <span style={{ fontSize: "0.85rem", color: "#334155", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                          <MapPin size={12} color="#EF4444" />
                          <span>{worker.location || "Patiala"}</span>
                        </span>
                      </td>

                      {/* 6. Submission Date */}
                      <td style={styles.td}>
                        <div>
                          <div style={{ fontWeight: 600, color: "#1E293B", fontSize: "0.86rem" }}>
                            {subTime.relative || subTime.formatted}
                          </div>
                          <div style={{ fontSize: "0.74rem", color: "#94A3B8" }}>
                            {subTime.formatted}
                          </div>
                        </div>
                      </td>

                      {/* 7. Status */}
                      <td style={styles.td}>
                        {isPending && (
                          <span style={{ ...styles.rowStatusTag, background: "#FEF3C7", color: "#92400E" }}>
                            <Clock size={12} />
                            <span>Pending</span>
                          </span>
                        )}
                        {isApproved && (
                          <span style={{ ...styles.rowStatusTag, background: "#D1FAE5", color: "#065F46" }}>
                            <CheckCircle2 size={12} />
                            <span>Approved</span>
                          </span>
                        )}
                        {isRejected && (
                          <span style={{ ...styles.rowStatusTag, background: "#FEE2E2", color: "#991B1B" }}>
                            <XCircle size={12} />
                            <span>Declined</span>
                          </span>
                        )}
                      </td>

                      {/* 8. Actions (e.stopPropagation to prevent row click interference) */}
                      <td style={{ ...styles.td, textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "inline-flex", gap: "0.45rem", alignItems: "center" }}>
                          {/* Quick Inspect Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenReviewModal(worker)}
                            style={styles.inspectBtn}
                            title="Inspect full profile & credentials"
                          >
                            <Eye size={13} />
                            <span>Review</span>
                          </button>

                          {/* Quick Approve / Reject for Pending */}
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(worker._id)}
                                disabled={actionLoading}
                                style={styles.quickApproveBtn}
                                title="Approve application instantly"
                              >
                                <Check size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedWorker(worker);
                                }}
                                disabled={actionLoading}
                                style={styles.quickRejectBtn}
                                title="Decline application"
                              >
                                <X size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ── Worker Application Review Modal ── */}
      {selectedWorker && (
        <AdminWorkerReviewModal
          worker={selectedWorker}
          onClose={() => setSelectedWorker(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          actionLoading={actionLoading}
        />
      )}

    </div>
  );
}

const styles = {
  toastNotice: {
    position: "fixed",
    bottom: "2rem",
    right: "2rem",
    color: "white",
    padding: "0.9rem 1.4rem",
    borderRadius: "14px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    zIndex: 10000,
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    fontSize: "0.92rem",
    fontWeight: 600,
  },
  toastCloseBtn: {
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.8)",
    cursor: "pointer",
    fontSize: "0.9rem",
    marginLeft: "0.5rem",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: "1rem",
    marginBottom: "2rem",
  },
  sectionBadge: {
    fontSize: "0.75rem",
    fontWeight: 800,
    letterSpacing: "1.2px",
    color: "var(--primary, #2563EB)",
    textTransform: "uppercase",
    display: "flex",
    alignItems: "center",
  },
  mainTitle: {
    fontSize: "2.1rem",
    fontWeight: 800,
    color: "#0F172A",
    letterSpacing: "-0.02em",
    margin: "0.25rem 0 0",
  },
  refreshBtn: {
    background: "white",
    border: "1.5px solid #CBD5E1",
    padding: "0.6rem 1.15rem",
    borderRadius: "12px",
    fontSize: "0.88rem",
    fontWeight: 600,
    color: "#334155",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.45rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "1.25rem",
    marginBottom: "2rem",
  },
  statCard: {
    borderRadius: "18px",
    border: "1.5px solid",
    padding: "1.25rem 1.4rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
  },
  statLabel: {
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  statHint: {
    fontSize: "0.74rem",
    color: "#94A3B8",
    fontWeight: 500,
    marginTop: "0.25rem",
  },
  controlsWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  filterPillsRow: {
    display: "flex",
    gap: "0.6rem",
    overflowX: "auto",
    paddingBottom: "0.25rem",
  },
  statusFilterBtn: {
    padding: "0.6rem 1.15rem",
    borderRadius: "30px",
    border: "1.5px solid",
    cursor: "pointer",
    fontSize: "0.88rem",
    whiteSpace: "nowrap",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.45rem",
    transition: "all 0.15s ease",
  },
  pillCount: {
    fontSize: "0.75rem",
    fontWeight: 800,
    padding: "0.15rem 0.5rem",
    borderRadius: "10px",
  },
  searchAndSelectorsStrip: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
    width: "100%",
  },
  searchBox: {
    flex: 2,
    minWidth: "280px",
    background: "white",
    border: "1.5px solid #CBD5E1",
    borderRadius: "12px",
    padding: "0.6rem 0.85rem",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  searchInput: {
    width: "100%",
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: "0.9rem",
    color: "#0F172A",
  },
  dropdownWrap: {
    flex: 1,
    minWidth: "200px",
    background: "white",
    border: "1.5px solid #CBD5E1",
    borderRadius: "12px",
    padding: "0.5rem 0.75rem",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
  },
  selectInput: {
    width: "100%",
    border: "none",
    background: "transparent",
    outline: "none",
    fontSize: "0.86rem",
    fontWeight: 600,
    color: "#334155",
    cursor: "pointer",
  },
  tableCardContainer: {
    background: "white",
    borderRadius: "20px",
    border: "1.5px solid #E2E8F0",
    overflow: "hidden",
    boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
  },
  tableHeaderBar: {
    padding: "1.25rem 1.75rem",
    borderBottom: "1px solid #E2E8F0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#F8FAFC",
    flexWrap: "wrap",
    gap: "0.75rem",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    minWidth: "900px",
  },
  th: {
    padding: "0.9rem 1.4rem",
    background: "#F8FAFC",
    fontWeight: 700,
    color: "#475569",
    fontSize: "0.74rem",
    textTransform: "uppercase",
    letterSpacing: "0.7px",
    borderBottom: "1.5px solid #E2E8F0",
  },
  td: {
    padding: "1.1rem 1.4rem",
    borderBottom: "1px solid #F1F5F9",
    verticalAlign: "middle",
  },
  tableRow: {
    cursor: "pointer",
    transition: "background 0.15s ease",
  },
  rowAvatar: {
    width: "42px",
    height: "42px",
    borderRadius: "12px",
    overflow: "hidden",
    flexShrink: 0,
    boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
  },
  rowAvatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  rowAvatarFallback: {
    width: "100%",
    height: "100%",
    color: "white",
    fontWeight: 800,
    fontSize: "1.1rem",
    alignItems: "center",
    justifyContent: "center",
  },
  rowNewBadge: {
    fontSize: "0.68rem",
    fontWeight: 800,
    background: "#EFF6FF",
    color: "#2563EB",
    border: "1px solid #BFDBFE",
    padding: "0.1rem 0.4rem",
    borderRadius: "4px",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.2rem",
    letterSpacing: "0.5px",
  },
  categoryBadge: {
    fontSize: "0.74rem",
    fontWeight: 700,
    padding: "0.15rem 0.55rem",
    borderRadius: "10px",
    border: "1px solid",
    display: "inline-flex",
    alignItems: "center",
  },
  rowStatusTag: {
    fontSize: "0.74rem",
    fontWeight: 700,
    padding: "0.2rem 0.6rem",
    borderRadius: "12px",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
  },
  inspectBtn: {
    background: "#EFF6FF",
    color: "var(--primary)",
    border: "1px solid #BFDBFE",
    padding: "0.35rem 0.75rem",
    borderRadius: "8px",
    fontSize: "0.78rem",
    fontWeight: 700,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
  },
  quickApproveBtn: {
    background: "#10B981",
    color: "white",
    border: "none",
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  quickRejectBtn: {
    background: "white",
    color: "#EF4444",
    border: "1px solid #FCA5A5",
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  emptyTableState: {
    padding: "4rem 2rem",
    textAlign: "center",
  },
  resetBtn: {
    background: "var(--primary)",
    color: "white",
    border: "none",
    padding: "0.6rem 1.4rem",
    borderRadius: "10px",
    fontWeight: 700,
    fontSize: "0.88rem",
    cursor: "pointer",
  },
  spinner: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "4px solid #E2E8F0",
    borderTopColor: "var(--primary, #2563EB)",
    animation: "spin 0.8s linear infinite",
    margin: "0 auto",
  }
};
