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
  ArrowUpDown,
  RefreshCw,
  Eye,
  MapPin,
  BriefcaseBusiness,
  AlertCircle,
  User,
} from "lucide-react";

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
    relative: rel,
  };
}

export default function AdminDashboard() {
  const { token } = useAuth();

  const [workers, setWorkers] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [activeStatusFilter, setActiveStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOption, setSortOption] = useState("newest");

  // Selected worker for Review Modal
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

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
      const workersData = await getAllWorkers(token, { sort: sortOption });
      const workersList = Array.isArray(workersData) ? workersData : [];
      setWorkers(workersList);

      const computedStats = {
        total: workersList.length,
        pending: workersList.filter((w) => (w.status || "pending") === "pending").length,
        approved: workersList.filter((w) => w.status === "approved").length,
        rejected: workersList.filter((w) => w.status === "rejected").length,
      };

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
      showToast(err.message || "Failed to load dashboard data.", "error");
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

  const handleOpenReviewModal = async (worker) => {
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
      const fullDetails = await getWorkerDetails(worker._id, token);
      setSelectedWorker(fullDetails);
    } catch {
      setSelectedWorker(worker);
    }
  };

  const handleApprove = async (workerId) => {
    setActionLoading(true);
    try {
      const res = await approveWorker(workerId, token);
      showToast(`Worker application approved! Notification sent to ${res.worker?.userId?.email || "worker"}.`, "success");

      setWorkers((prev) =>
        prev.map((w) => (w._id === workerId ? { ...w, status: "approved", reviewedAt: new Date() } : w))
      );

      setStats((prev) => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        approved: prev.approved + 1,
      }));

      getAdminStats(token).then((s) => s && setStats(s)).catch(() => {});

      if (selectedWorker?._id === workerId) {
        setSelectedWorker((prev) => ({ ...prev, status: "approved", reviewedAt: new Date() }));
      }
    } catch (err) {
      showToast(err.message || "Failed to approve application.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (workerId, reason = "") => {
    setActionLoading(true);
    try {
      const res = await rejectWorker(workerId, token, reason);
      showToast(`Worker application declined. Notification sent to ${res.worker?.userId?.email || "worker"}.`, "info");

      setWorkers((prev) =>
        prev.map((w) =>
          w._id === workerId
            ? { ...w, status: "rejected", rejectionReason: reason, reviewedAt: new Date() }
            : w
        )
      );

      setStats((prev) => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        rejected: prev.rejected + 1,
      }));

      getAdminStats(token).then((s) => s && setStats(s)).catch(() => {});

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

  const filteredAndSortedWorkers = useMemo(() => {
    let list = [...workers];

    if (activeStatusFilter !== "all") {
      list = list.filter((w) => (w.status || "pending") === activeStatusFilter);
    }

    if (selectedCategory !== "all") {
      list = list.filter((w) => (w.category || "").toLowerCase() === selectedCategory.toLowerCase());
    }

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

    list.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      if (sortOption === "newest") return timeB - timeA;
      if (sortOption === "oldest") return timeA - timeB;
      if (sortOption === "charges_high") return (b.charges || 0) - (a.charges || 0);
      if (sortOption === "charges_low") return (a.charges || 0) - (b.charges || 0);
      return timeB - timeA;
    });

    return list;
  }, [workers, activeStatusFilter, selectedCategory, searchQuery, sortOption]);

  const categoriesList = ["Electrician", "Plumber", "Carpenter", "Painter", "Cleaning", "AC Repair"];

  return (
    <div
      className="admin-dashboard-page"
      style={{
        display: "flex",
        minHeight: "calc(100vh - 58px)",
        background: "var(--color-bg-soft, #F1F5FC)",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        color: "var(--color-text-primary, #172554)",
      }}
    >
      {/* ── Toast Banner ── */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            background: toast.type === "error" ? "#B34F52" : toast.type === "info" ? "#1E4E8C" : "#27805E",
            color: "#FFFFFF",
            padding: "0.85rem 1.25rem",
            borderRadius: "8px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            fontSize: "0.88rem",
            fontWeight: 600,
          }}
        >
          {toast.type === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            style={{
              background: "none",
              border: "none",
              color: "#FFFFFF",
              cursor: "pointer",
              marginLeft: "0.5rem",
              padding: "0.2rem",
              fontSize: "0.9rem",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Sidebar: Dark (#0F172A), 220px wide, sticky left ── */}
      <aside
        className="admin-dashboard-sidebar"
        style={{
          width: "220px",
          minWidth: "220px",
          background: "var(--color-navy, #142B55)",
          display: "flex",
          flexDirection: "column",
          padding: "1.75rem 0",
          boxSizing: "border-box",
          flexShrink: 0,
        }}
      >
        <div style={{ padding: "0 1.25rem", marginBottom: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "#B8D4C7",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
            }}
          >
            <ShieldCheck size={14} />
            <span>Admin Console</span>
          </div>
          <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#FFFFFF", marginTop: "0.3rem" }}>
            ServeConnect
          </div>
        </div>

        {/* Section Divider */}
        <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", margin: "0.5rem 0 1rem" }} />

        {/* Navigation items */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
          <button
            type="button"
            onClick={() => setActiveStatusFilter("pending")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.7rem 1.25rem",
              background: activeStatusFilter === "pending" ? "rgba(255,255,255,0.06)" : "transparent",
              color: activeStatusFilter === "pending" ? "#FFFFFF" : "rgba(255,255,255,0.6)",
              border: "none",
              borderLeft: activeStatusFilter === "pending" ? "3px solid #1E4E8C" : "3px solid transparent",
              textAlign: "left",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: activeStatusFilter === "pending" ? 700 : 500,
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <Clock size={15} />
              <span>Pending Review</span>
            </div>
            {stats.pending > 0 && (
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  background: "#A77732",
                  color: "#FFFFFF",
                  padding: "0.1rem 0.45rem",
                  borderRadius: "10px",
                }}
              >
                {stats.pending}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveStatusFilter("approved")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.7rem 1.25rem",
              background: activeStatusFilter === "approved" ? "rgba(255,255,255,0.06)" : "transparent",
              color: activeStatusFilter === "approved" ? "#FFFFFF" : "rgba(255,255,255,0.6)",
              border: "none",
              borderLeft: activeStatusFilter === "approved" ? "3px solid #1E4E8C" : "3px solid transparent",
              textAlign: "left",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: activeStatusFilter === "approved" ? 700 : 500,
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <CheckCircle2 size={15} />
              <span>Approved Workers</span>
            </div>
            <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>{stats.approved}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStatusFilter("all")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.7rem 1.25rem",
              background: activeStatusFilter === "all" ? "rgba(255,255,255,0.06)" : "transparent",
              color: activeStatusFilter === "all" ? "#FFFFFF" : "rgba(255,255,255,0.6)",
              border: "none",
              borderLeft: activeStatusFilter === "all" ? "3px solid #1E4E8C" : "3px solid transparent",
              textAlign: "left",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: activeStatusFilter === "all" ? 700 : 500,
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <BriefcaseBusiness size={15} />
              <span>All Applications</span>
            </div>
            <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>{stats.total}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveStatusFilter("rejected")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.7rem 1.25rem",
              background: activeStatusFilter === "rejected" ? "rgba(255,255,255,0.06)" : "transparent",
              color: activeStatusFilter === "rejected" ? "#FFFFFF" : "rgba(255,255,255,0.6)",
              border: "none",
              borderLeft: activeStatusFilter === "rejected" ? "3px solid #1E4E8C" : "3px solid transparent",
              textAlign: "left",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: activeStatusFilter === "rejected" ? 700 : 500,
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <XCircle size={15} />
              <span>Declined</span>
            </div>
            <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>{stats.rejected}</span>
          </button>
        </div>

        {/* Section Divider */}
        <div style={{ height: "1px", background: "rgba(255,255,255,0.1)", margin: "1.5rem 0" }} />

        {/* Bottom Refresh Action */}
        <div style={{ marginTop: "auto", padding: "0 1.25rem" }}>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            style={{
              width: "100%",
              padding: "0.5rem 0.8rem",
              borderRadius: "6px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#FFFFFF",
              fontSize: "0.78rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              cursor: refreshing ? "wait" : "pointer",
            }}
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            <span>{refreshing ? "Syncing..." : "Sync Records"}</span>
          </button>
        </div>
      </aside>

      {/* ── Main Area (Remaining Width) ── */}
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        
        {/* ── Stats Strip (Top of Main Area): Horizontal row, NO stat cards ── */}
        <div
          style={{
            background: "#FFFFFF",
            borderBottom: "1px solid #E8EFEC",
            display: "flex",
            overflowX: "auto",
          }}
        >
          {[
            {
              label: "Total Workers",
              value: stats.total,
              action: () => setActiveStatusFilter("all"),
              isActive: activeStatusFilter === "all",
            },
            {
              label: "Pending Approval",
              value: stats.pending,
              action: () => setActiveStatusFilter("pending"),
              isActive: activeStatusFilter === "pending",
              highlightColor: "#A77732",
            },
            {
              label: "Approved Partners",
              value: stats.approved,
              action: () => setActiveStatusFilter("approved"),
              isActive: activeStatusFilter === "approved",
              highlightColor: "#27805E",
            },
            {
              label: "Declined Applications",
              value: stats.rejected,
              action: () => setActiveStatusFilter("rejected"),
              isActive: activeStatusFilter === "rejected",
              highlightColor: "#B34F52",
            },
          ].map((item, idx, arr) => (
            <div
              key={idx}
              onClick={item.action}
              style={{
                flex: 1,
                minWidth: "150px",
                padding: "1rem 1.5rem",
                borderRight: idx === arr.length - 1 ? "none" : "1px solid #E8EFEC",
                cursor: "pointer",
                background: item.isActive ? "#F3F5F4" : "transparent",
                transition: "background 0.15s ease",
              }}
            >
              <div
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 800,
                  color: item.highlightColor || "#0F172A",
                  lineHeight: 1.2,
                }}
              >
                {item.value}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#94A1A0",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  marginTop: "0.25rem",
                }}
              >
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Filter / Search Controls: Inline horizontal, NO heavy filter card ── */}
        <div
          style={{
            padding: "1.25rem 2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            borderBottom: "1px solid #E8EFEC",
          }}
        >
          {/* Search Input */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "#FFFFFF",
              border: "1px solid #D5E0DC",
              borderRadius: "8px",
              padding: "0.45rem 0.8rem",
              flex: "1 1 240px",
              maxWidth: "360px",
            }}
          >
            <Search size={14} color="#94A1A0" />
            <input
              type="text"
              placeholder="Search by worker name, email, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: "0.85rem",
                color: "#0F172A",
                width: "100%",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{ background: "none", border: "none", color: "#94A1A0", cursor: "pointer", padding: 0 }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Selectors */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "#FFFFFF",
                border: "1px solid #D5E0DC",
                borderRadius: "8px",
                padding: "0.45rem 0.75rem",
              }}
            >
              <Filter size={13} color="#657477" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: "0.82rem",
                  color: "#0F172A",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <option value="all">All Categories</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "#FFFFFF",
                border: "1px solid #D5E0DC",
                borderRadius: "8px",
                padding: "0.45rem 0.75rem",
              }}
            >
              <ArrowUpDown size={13} color="#657477" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: "0.82rem",
                  color: "#0F172A",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <option value="newest">Sort: Newest</option>
                <option value="oldest">Sort: Oldest</option>
                <option value="charges_high">Rate: High to Low</option>
                <option value="charges_low">Rate: Low to High</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Worker Approval Section: Clean Data Table ── */}
        <div style={{ padding: "1.5rem 2rem 4rem", overflowX: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>
              {activeStatusFilter === "pending"
                ? "Pending Applications"
                : activeStatusFilter === "approved"
                ? "Verified Partners"
                : activeStatusFilter === "rejected"
                ? "Declined Submissions"
                : "All Registered Professionals"}
            </h2>
            <span style={{ fontSize: "0.78rem", color: "#657477" }}>
              {filteredAndSortedWorkers.length} {filteredAndSortedWorkers.length === 1 ? "record" : "records"}
            </span>
          </div>

          {loading ? (
            <div style={{ padding: "4rem 2rem", textAlign: "center", color: "#657477" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  border: "3px solid #D5E0DC",
                  borderTopColor: "#1E4E8C",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  margin: "0 auto 1rem",
                }}
              />
              <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>Loading verification records...</span>
            </div>
          ) : filteredAndSortedWorkers.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "4rem 2rem",
                background: "#FFFFFF",
                borderRadius: "8px",
                border: "1px solid #E8EFEC",
              }}
            >
              <ShieldCheck size={36} color="#94A1A0" style={{ margin: "0 auto 0.75rem" }} />
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0F172A", marginBottom: "0.3rem" }}>
                No records matching current filters
              </h3>
              <p style={{ color: "#94A1A0", fontSize: "0.85rem", maxWidth: "380px", margin: "0 auto" }}>
                Try adjusting your search keywords or switching to a different status tab in the sidebar.
              </p>
            </div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.86rem",
                textAlign: "left",
              }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid #D5E0DC" }}>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", color: "#94A1A0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Name
                  </th>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", color: "#94A1A0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Category
                  </th>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", color: "#94A1A0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    City / Location
                  </th>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", color: "#94A1A0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Hourly Rate
                  </th>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", color: "#94A1A0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Status
                  </th>
                  <th style={{ padding: "0.75rem 1rem", fontSize: "0.72rem", color: "#94A1A0", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "right" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedWorkers.map((worker, index) => {
                  const isPending = worker.status === "pending";
                  const isApproved = worker.status === "approved";
                  const rowBg = index % 2 === 0 ? "#FFFFFF" : "#F3F5F4";
                  const subTime = formatSubmissionDate(worker.createdAt);

                  return (
                    <tr
                      key={worker._id}
                      onClick={() => handleOpenReviewModal(worker)}
                      style={{
                        background: rowBg,
                        borderBottom: "1px solid #E8EFEC",
                        cursor: "pointer",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#FFFFFF")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = rowBg)}
                    >
                      {/* Name */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              background: "#EEF4FB",
                              color: "#1E4E8C",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: "0.85rem",
                              flexShrink: 0,
                            }}
                          >
                            {worker.userId?.name?.charAt(0)?.toUpperCase() || "W"}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "#0F172A" }}>
                              {worker.userId?.name || "Applicant"}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#657477" }}>
                              {worker.userId?.email || subTime.relative}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#1E4E8C",
                            background: "#EEF4FB",
                            padding: "0.2rem 0.55rem",
                            borderRadius: "4px",
                          }}
                        >
                          {worker.category || "General"}
                        </span>
                      </td>

                      {/* City */}
                      <td style={{ padding: "0.85rem 1rem", color: "#657477" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                          <MapPin size={12} color="#94A1A0" />
                          <span>{worker.location || "Patiala"}</span>
                        </span>
                      </td>

                      {/* Rate */}
                      <td style={{ padding: "0.85rem 1rem", fontWeight: 700, color: "#0F172A" }}>
                        ₹{worker.charges || 300}/hr
                      </td>

                      {/* Status: Small colored dot + text */}
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            padding: "0.15rem 0.55rem",
                            borderRadius: "100px",
                            background: isPending ? "#F5F0E8" : isApproved ? "#EDF5F0" : "#F5ECEC",
                            color: isPending ? "#A77732" : isApproved ? "#27805E" : "#B34F52",
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: isPending ? "#A77732" : isApproved ? "#27805E" : "#B34F52",
                            }}
                          />
                          <span>{isPending ? "Pending" : isApproved ? "Approved" : "Declined"}</span>
                        </span>
                      </td>

                      {/* Actions: Small buttons */}
                      <td
                        style={{ padding: "0.85rem 1rem", textAlign: "right" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleOpenReviewModal(worker)}
                            style={{
                              background: "transparent",
                              border: "1px solid #D5E1F0",
                              color: "#1E4E8C",
                              borderRadius: "6px",
                              padding: "0.2rem 0.55rem",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                            }}
                          >
                            <Eye size={12} />
                            <span>Review</span>
                          </button>

                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(worker._id)}
                                disabled={actionLoading}
                                title="Approve"
                                style={{
                                  background: "transparent",
                                  border: "1px solid #27805E",
                                  color: "#27805E",
                                  borderRadius: "6px",
                                  padding: "0.2rem 0.5rem",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                <Check size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                  setSelectedWorker(worker);
                                }}
                                disabled={actionLoading}
                                title="Decline"
                                style={{
                                  background: "transparent",
                                  border: "1px solid #B34F52",
                                  color: "#B34F52",
                                  borderRadius: "6px",
                                  padding: "0.2rem 0.5rem",
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                <X size={12} />
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
          )}
        </div>
      </main>

      {/* ── Review Modal ── */}
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
