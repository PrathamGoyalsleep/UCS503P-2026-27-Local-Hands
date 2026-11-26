import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getMyBookings } from "../services/bookingService";
import {
  User,
  Mail,
  ShieldCheck,
  Camera,
  CalendarDays,
  CheckCircle2,
  Clock,
  LogOut,
  ArrowRight,
  BriefcaseBusiness,
  Loader2,
  IndianRupee,
  Bell,
  Lock,
  ExternalLink,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Profile() {
  const { user, token, login, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // overview | bookings | settings

  // Settings form state
  const [formName, setFormName] = useState(user?.name || "");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  useEffect(() => {
    async function loadBookings() {
      if (!token) return;
      try {
        const data = await getMyBookings(token);
        setBookings(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("[Profile] Failed to load bookings:", err);
      } finally {
        setLoadingBookings(false);
      }
    }
    loadBookings();
  }, [token]);

  useEffect(() => {
    if (user?.name) setFormName(user.name);
  }, [user]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file (JPEG, PNG, or WEBP).", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size must be under 5MB.", "error");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`${API_URL}/api/auth/upload-profile-image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to upload profile photo.");
      }

      login(token, {
        ...user,
        profileImage: data.profileImage || data.user?.profileImage,
      });
      showToast("Profile photo updated successfully!", "success");
    } catch (err) {
      showToast(err.message || "Could not upload profile photo.", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLogout = () => {
    logout();
    showToast("You have been signed out.", "success");
    navigate("/login", { replace: true });
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    showToast("Profile preferences saved.", "success");
  };

  const totalBookings = bookings.length;
  const activeBookings = bookings.filter((b) => ["pending", "accepted"].includes(b.status)).length;
  const completedBookings = bookings.filter((b) => ["completed", "paid"].includes(b.status)).length;
  const totalAmount = bookings
    .filter((b) => b.status === "paid" || b.paymentStatus === "paid")
    .reduce((sum, b) => sum + (Number(b.estimatedPrice) || 0), 0);

  const roleBadge = {
    admin: { label: "Platform Administrator", bg: "#EBF0F5", color: "#1E4E8C" },
    worker: { label: "Verified Service Partner", bg: "#EDF5F0", color: "#27805E" },
    customer: { label: "ServeConnect Member", bg: "#FFFFFF", color: "#657477" },
  }[user?.role || "customer"];

  return (
    <div
      className="profile-page"
      style={{
        minHeight: "100vh",
        background: "var(--color-bg-soft, #F1F5FC)",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        color: "var(--color-text-primary, #172554)",
      }}
    >
      {/* ── Profile Header: Dark Band (200px) ── */}
      <div
        className="profile-header"
        style={{
          background: "#0F172A",
          minHeight: "200px",
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          padding: "2rem 2rem 0",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            maxWidth: "var(--container-max, 1360px)",
            width: "100%",
            margin: "0 auto",
            display: "flex",
            alignItems: "flex-end",
            gap: "1.5rem",
            transform: "translateY(40px)",
          }}
        >
          {/* Avatar Circle (Overlapping band bottom) */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.name}
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "4px solid #FFFFFF",
                  background: "#E8EEEB",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  background: "#1E4E8C",
                  color: "#FFFFFF",
                  border: "4px solid #FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2.2rem",
                  fontWeight: 800,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label="Upload profile photo"
              style={{
                position: "absolute",
                bottom: "4px",
                right: "4px",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "#0F172A",
                color: "#FFFFFF",
                border: "2px solid #FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: uploading ? "wait" : "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              }}
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              style={{ display: "none" }}
            />
          </div>

          {/* Name & Role Badge in Header */}
          <div style={{ paddingBottom: "48px" }}>
            <h1
              style={{
                fontSize: "1.85rem",
                fontWeight: 800,
                color: "#FFFFFF",
                margin: 0,
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
              }}
            >
              {user?.name || "ServeConnect Member"}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.35rem" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  padding: "0.15rem 0.55rem",
                  borderRadius: "100px",
                  background: "rgba(255, 255, 255, 0.12)",
                  color: "#FFFFFF",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              >
                <ShieldCheck size={12} />
                <span>{roleBadge.label}</span>
              </span>
              <span style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: "0.8rem" }}>&bull;</span>
              <span style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: "0.8rem" }}>
                {user?.email}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body: 2 Columns (1/3 sidebar, 2/3 main content) ── */}
      <div
        style={{
          maxWidth: "var(--container-max, 1360px)",
          margin: "0 auto",
          padding: "4.5rem 1.5rem 5rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
          gap: "2.5rem",
          alignItems: "start",
        }}
      >
        {/* ── Sidebar (Left Column: 1/3) ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#94A1A0",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                marginBottom: "0.5rem",
              }}
            >
              Account Details
            </div>

            {/* Contact info rows: NO card box, clean rows on warm background */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.8rem",
                  padding: "0.85rem 0",
                  borderBottom: "1px solid #E8EFEC",
                }}
              >
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "6px",
                    background: "#FFFFFF",
                    border: "1px solid #E8EFEC",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#1E4E8C",
                  }}
                >
                  <User size={15} />
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "#94A1A0", fontWeight: 600 }}>Full Name</div>
                  <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#0F172A" }}>{user?.name}</div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.8rem",
                  padding: "0.85rem 0",
                  borderBottom: "1px solid #E8EFEC",
                }}
              >
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "6px",
                    background: "#FFFFFF",
                    border: "1px solid #E8EFEC",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#1E4E8C",
                  }}
                >
                  <Mail size={15} />
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "#94A1A0", fontWeight: 600 }}>Email Address</div>
                  <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#0F172A" }}>{user?.email}</div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.8rem",
                  padding: "0.85rem 0",
                  borderBottom: "1px solid #E8EFEC",
                }}
              >
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "6px",
                    background: "#FFFFFF",
                    border: "1px solid #E8EFEC",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#1E4E8C",
                  }}
                >
                  <ShieldCheck size={15} />
                </div>
                <div>
                  <div style={{ fontSize: "0.72rem", color: "#94A1A0", fontWeight: 600 }}>Account Standing</div>
                  <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#27805E" }}>Active & Verified</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons: Outline style */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: "100%",
                padding: "0.55rem 1rem",
                borderRadius: "6px",
                border: "1px solid #1E4E8C",
                background: "transparent",
                color: "#1E4E8C",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
              }}
            >
              <Camera size={14} />
              <span>Update Profile Picture</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "0.55rem 1rem",
                borderRadius: "6px",
                border: "1px solid #B34F52",
                background: "transparent",
                color: "#B34F52",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
              }}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* ── Main Content (Right Column: 2/3) ── */}
        <div style={{ minWidth: 0 }}>
          {/* Tabs: Underline style */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              borderBottom: "1px solid #E8EFEC",
              marginBottom: "1.75rem",
            }}
          >
            {[
              { id: "overview", label: "Overview" },
              { id: "bookings", label: `Bookings (${totalBookings})` },
              { id: "settings", label: "Settings" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    borderBottom: isActive ? "2px solid #1E4E8C" : "2px solid transparent",
                    color: isActive ? "#0F172A" : "#657477",
                    fontWeight: isActive ? 700 : 500,
                    fontSize: "0.9rem",
                    padding: "0.65rem 1.25rem",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {/* Stats Strip: Horizontal strip with dividers — NOT stat cards */}
              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#94A1A0",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "0.5rem",
                  }}
                >
                  Activity Metrics
                </div>

                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E8EFEC",
                    borderRadius: "8px",
                    display: "flex",
                    overflowX: "auto",
                  }}
                >
                  {[
                    { label: "Total Bookings", value: loadingBookings ? "—" : totalBookings },
                    { label: "Active Visits", value: loadingBookings ? "—" : activeBookings },
                    { label: "Completed", value: loadingBookings ? "—" : completedBookings },
                    {
                      label: user?.role === "worker" ? "Verified Earnings" : "Total Paid",
                      value: loadingBookings ? "—" : `₹${totalAmount.toLocaleString("en-IN")}`,
                    },
                  ].map((metric, idx, arr) => (
                    <div
                      key={idx}
                      style={{
                        flex: 1,
                        minWidth: "120px",
                        padding: "1rem 1.25rem",
                        borderRight: idx === arr.length - 1 ? "none" : "1px solid #E8EFEC",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "1.35rem",
                          fontWeight: 800,
                          color: "#0F172A",
                          lineHeight: 1.2,
                        }}
                      >
                        {metric.value}
                      </div>
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "#94A1A0",
                          textTransform: "uppercase",
                          fontWeight: 600,
                          letterSpacing: "0.5px",
                          marginTop: "0.2rem",
                        }}
                      >
                        {metric.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity List: Clean rows */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#94A1A0",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Recent Service Records
                  </div>
                  <Link
                    to="/bookings"
                    style={{
                      fontSize: "0.8rem",
                      color: "#1E4E8C",
                      fontWeight: 600,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <span>View all bookings</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>

                <div
                  style={{
                    background: "#FFFFFF",
                    borderRadius: "8px",
                    border: "1px solid #E8EFEC",
                    overflow: "hidden",
                  }}
                >
                  {loadingBookings ? (
                    <div style={{ padding: "1.5rem", color: "#657477", fontSize: "0.88rem" }}>
                      Loading recent service activity...
                    </div>
                  ) : bookings.length === 0 ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "#94A1A0", fontSize: "0.88rem" }}>
                      No recent bookings recorded on your account.
                    </div>
                  ) : (
                    bookings.slice(0, 4).map((b) => {
                      const partnerName =
                        user?.role === "worker"
                          ? b.customerId?.name || "Client"
                          : b.workerId?.userId?.name || "Service Partner";
                      const isPending = b.status === "pending";
                      const isDone = ["completed", "paid"].includes(b.status);
                      const badgeColor = isPending ? "#A77732" : isDone ? "#27805E" : "#1E4E8C";
                      const badgeBg = isPending ? "#F5F0E8" : isDone ? "#EDF5F0" : "#EBF0F5";

                      return (
                        <div
                          key={b._id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "0.9rem 1.25rem",
                            borderBottom: "1px solid #E8EFEC",
                            gap: "1rem",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0F172A" }}>
                              {b.service || "Service Appointment"}
                            </div>
                            <div style={{ fontSize: "0.78rem", color: "#657477", marginTop: "0.15rem" }}>
                              {partnerName} &bull; {b.date || "Date scheduled"}
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                padding: "0.15rem 0.55rem",
                                borderRadius: "100px",
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                background: badgeBg,
                                color: badgeColor,
                              }}
                            >
                              <span
                                style={{
                                  width: "5px",
                                  height: "5px",
                                  borderRadius: "50%",
                                  background: badgeColor,
                                }}
                              />
                              <span>{b.paymentStatus === "paid" ? "Paid" : b.status}</span>
                            </span>

                            <Link
                              to="/bookings"
                              style={{
                                color: "#657477",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <ArrowRight size={14} />
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Quick Actions Shortcuts */}
              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#94A1A0",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "0.5rem",
                  }}
                >
                  Quick Actions
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <Link
                    to="/bookings"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.85rem 1.15rem",
                      borderRadius: "6px",
                      background: "#FFFFFF",
                      border: "1px solid #E8EFEC",
                      textDecoration: "none",
                      color: "#0F172A",
                      fontWeight: 600,
                      fontSize: "0.88rem",
                    }}
                  >
                    <span>
                      {user?.role === "worker"
                        ? "Open Partner Job Dashboard"
                        : "View All Bookings & Receipts"}
                    </span>
                    <ArrowRight size={15} color="#1E4E8C" />
                  </Link>

                  {user?.role === "customer" && (
                    <Link
                      to="/search"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.85rem 1.15rem",
                        borderRadius: "6px",
                        background: "#FFFFFF",
                        border: "1px solid #E8EFEC",
                        textDecoration: "none",
                        color: "#0F172A",
                        fontWeight: 600,
                        fontSize: "0.88rem",
                      }}
                    >
                      <span>Book a Verified Home Specialist</span>
                      <ArrowRight size={15} color="#1E4E8C" />
                    </Link>
                  )}

                  {user?.role === "worker" && (
                    <Link
                      to="/worker/register"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.85rem 1.15rem",
                        borderRadius: "6px",
                        background: "#FFFFFF",
                        border: "1px solid #E8EFEC",
                        textDecoration: "none",
                        color: "#0F172A",
                        fontWeight: 600,
                        fontSize: "0.88rem",
                      }}
                    >
                      <span>Manage Professional Application & Credentials</span>
                      <ArrowRight size={15} color="#1E4E8C" />
                    </Link>
                  )}

                  {user?.role === "admin" && (
                    <Link
                      to="/admin"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.85rem 1.15rem",
                        borderRadius: "6px",
                        background: "#FFFFFF",
                        border: "1px solid #E8EFEC",
                        textDecoration: "none",
                        color: "#0F172A",
                        fontWeight: 600,
                        fontSize: "0.88rem",
                      }}
                    >
                      <span>Open Administrator Verification Console</span>
                      <ArrowRight size={15} color="#1E4E8C" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BOOKINGS LIST */}
          {activeTab === "bookings" && (
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: "8px",
                border: "1px solid #E8EFEC",
                overflow: "hidden",
              }}
            >
              {loadingBookings ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "#657477" }}>
                  Loading booking history...
                </div>
              ) : bookings.length === 0 ? (
                <div style={{ padding: "3rem 2rem", textAlign: "center", color: "#94A1A0" }}>
                  No service appointments on record.
                </div>
              ) : (
                bookings.map((b) => {
                  const partnerName =
                    user?.role === "worker"
                      ? b.customerId?.name || "Client"
                      : b.workerId?.userId?.name || "Service Partner";
                  const bookingRef = `#SC-${b._id ? b._id.slice(-6).toUpperCase() : "REQ"}`;

                  return (
                    <div
                      key={b._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "1rem 1.25rem",
                        borderBottom: "1px solid #E8EFEC",
                        gap: "1rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "#0F172A" }}>
                            {b.service || "Home Service"}
                          </span>
                          <span style={{ fontSize: "0.72rem", color: "#94A1A0", fontWeight: 600 }}>
                            {bookingRef}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#657477", marginTop: "0.2rem" }}>
                          {partnerName} &bull; {b.date} {b.time ? `at ${b.time}` : ""}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            padding: "0.15rem 0.55rem",
                            borderRadius: "100px",
                            background: b.paymentStatus === "paid" ? "#EDF5F0" : "#EBF0F5",
                            color: b.paymentStatus === "paid" ? "#27805E" : "#1E4E8C",
                          }}
                        >
                          {b.paymentStatus === "paid" ? "Paid" : b.status}
                        </span>

                        <Link
                          to={`/chat/${b._id}`}
                          style={{
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            color: "#1E4E8C",
                            textDecoration: "none",
                            border: "1px solid #1E4E8C",
                            borderRadius: "6px",
                            padding: "0.25rem 0.6rem",
                          }}
                        >
                          Chat
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: SETTINGS */}
          {activeTab === "settings" && (
            <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#94A1A0",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "0.35rem",
                  }}
                >
                  Display Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  style={{
                    width: "100%",
                    maxWidth: "480px",
                    padding: "0.65rem 0.9rem",
                    background: "#FFFFFF",
                    border: "1px solid #D5E0DC",
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                    color: "#0F172A",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#94A1A0",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "0.35rem",
                  }}
                >
                  Registered Email
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  style={{
                    width: "100%",
                    maxWidth: "480px",
                    padding: "0.65rem 0.9rem",
                    background: "#E8EEEB",
                    border: "1px solid #D5E0DC",
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                    color: "#657477",
                    outline: "none",
                    boxSizing: "border-box",
                    cursor: "not-allowed",
                  }}
                />
              </div>

              <div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#94A1A0",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginBottom: "0.5rem",
                  }}
                >
                  Notification Preferences
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.88rem" }}>
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                      style={{ accentColor: "#1E4E8C" }}
                    />
                    <span>Receive booking confirmation & status updates via email</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.88rem" }}>
                    <input
                      type="checkbox"
                      checked={smsNotifications}
                      onChange={(e) => setSmsNotifications(e.target.checked)}
                      style={{ accentColor: "#1E4E8C" }}
                    />
                    <span>Receive instant SMS alerts before arrival</span>
                  </label>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  style={{
                    background: "#1E4E8C",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "6px",
                    padding: "0.55rem 1.4rem",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
