import { useState, useEffect } from "react";
import {
  X,
  BadgeCheck,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Clock3,
  CalendarDays,
  MapPin,
  Mail,
  Phone,
  BriefcaseBusiness,
  IndianRupee,
  Images,
  Star,
  FileText,
  AlertTriangle,
  Check,
  Sparkles,
  ExternalLink,
  Eye,
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

function formatDateTime(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRelativeTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHrs < 1) return "Just now";
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function AdminWorkerReviewModal({
  worker,
  onClose,
  onApprove,
  onReject,
  actionLoading = false,
}) {
  const [activeTab, setActiveTab] = useState("overview"); // overview, portfolio, reviews, documents
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (lightboxImg) setLightboxImg(null);
        else onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxImg, onClose]);

  if (!worker) return null;

  const catTheme = categoryTheme[worker.category] || {
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    Icon: BriefcaseBusiness,
  };
  const CategoryIcon = catTheme.Icon;

  const isPending = worker.status === "pending";
  const isApproved = worker.status === "approved";
  const isRejected = worker.status === "rejected";

  const workerName = worker.userId?.name || "Applicant";
  const workerEmail = worker.userId?.email || "No email on record";
  const workerPhone = worker.phone || worker.userId?.phone || "No phone on record";

  const isRecentlySubmitted =
    isPending &&
    worker.createdAt &&
    Date.now() - new Date(worker.createdAt).getTime() < 1000 * 60 * 60 * 72; // within 72 hrs

  const handleApproveClick = () => {
    if (!confirmApprove) {
      setConfirmApprove(true);
      return;
    }
    onApprove(worker._id);
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    onReject(worker._id, rejectReason);
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div style={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        
        {/* Header Bar */}
        <div style={styles.modalHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--primary)", background: "#EFF6FF", padding: "0.25rem 0.65rem", borderRadius: "8px", border: "1px solid #BFDBFE" }}>
              APPLICATION REF #{worker._id.slice(-6).toUpperCase()}
            </span>

            {/* Status Indicator */}
            {isPending && (
              <span style={{ ...styles.statusTag, background: "#FFFBEB", color: "#D97706", borderColor: "#FDE68A" }}>
                <Clock size={13} color="#D97706" />
                <span>Pending Review</span>
              </span>
            )}
            {isApproved && (
              <span style={{ ...styles.statusTag, background: "#F0FDF4", color: "#059669", borderColor: "#A7F3D0" }}>
                <CheckCircle2 size={13} color="#059669" />
                <span>Approved & Active</span>
              </span>
            )}
            {isRejected && (
              <span style={{ ...styles.statusTag, background: "#FFF1F2", color: "#DC2626", borderColor: "#FECACA" }}>
                <XCircle size={13} color="#DC2626" />
                <span>Application Declined</span>
              </span>
            )}

            {isRecentlySubmitted && (
              <span style={styles.newBadge}>
                <Sparkles size={11} color="#2563EB" />
                <span>NEW SUBMISSION</span>
              </span>
            )}
          </div>

          <button onClick={onClose} style={styles.closeBtn} aria-label="Close review dialog">
            <X size={18} color="#475569" />
          </button>
        </div>

        {/* Profile Identity Strip */}
        <div style={styles.identityStrip}>
          <div style={styles.avatarWrapper}>
            {worker.photo ? (
              <img
                src={worker.photo}
                alt={workerName}
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
                background: `linear-gradient(135deg, ${catTheme.color}, #1E40AF)`,
                display: worker.photo ? "none" : "flex",
              }}
            >
              {workerName.charAt(0)}
            </div>
          </div>

          <div style={{ flex: 1, minWidth: "260px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
              <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>
                {workerName}
              </h2>
              <span style={{ ...styles.categoryPill, background: catTheme.bg, color: catTheme.color, borderColor: catTheme.border }}>
                <CategoryIcon size={13} style={{ marginRight: "0.3rem" }} />
                <span>{worker.category || "Professional"}</span>
              </span>
            </div>

            <div style={styles.contactRow}>
              <span style={styles.contactItem}>
                <Mail size={13} color="#64748B" />
                <a href={`mailto:${workerEmail}`} style={{ color: "inherit", textDecoration: "none" }}>
                  {workerEmail}
                </a>
              </span>
              <span>&bull;</span>
              <span style={styles.contactItem}>
                <Phone size={13} color="#64748B" />
                <a href={`tel:${workerPhone}`} style={{ color: "inherit", textDecoration: "none" }}>
                  +91 {workerPhone}
                </a>
              </span>
              <span>&bull;</span>
              <span style={styles.contactItem}>
                <MapPin size={13} color="#EF4444" />
                <span>{worker.location || "Location unassigned"}</span>
              </span>
            </div>

            <div style={{ fontSize: "0.78rem", color: "#64748B", marginTop: "0.35rem" }}>
              <span>Submitted: </span>
              <strong>{formatDateTime(worker.createdAt)}</strong>
              {worker.createdAt && <span> ({getRelativeTime(worker.createdAt)})</span>}
              {worker.reviewedAt && (
                <span style={{ marginLeft: "0.75rem", color: isApproved ? "#059669" : "#DC2626" }}>
                  &bull; Reviewed on {formatDateTime(worker.reviewedAt)}
                  {worker.reviewedBy?.name ? ` by ${worker.reviewedBy.name}` : ""}
                </span>
              )}
            </div>
          </div>

          <div style={styles.rateHighlightBox}>
            <div style={{ fontSize: "0.72rem", color: "#64748B", textTransform: "uppercase", fontWeight: 700 }}>
              Hourly Charges
            </div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#2563EB", display: "flex", alignItems: "center" }}>
              <IndianRupee size={16} />
              <span>{worker.charges || 300}</span>
              <span style={{ fontSize: "0.8rem", color: "#64748B", fontWeight: 500 }}>/hr</span>
            </div>
          </div>
        </div>

        {/* Rejection Alert Callout if previously rejected */}
        {isRejected && worker.rejectionReason && (
          <div style={styles.rejectionNotice}>
            <AlertTriangle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: "0.15rem" }} />
            <div>
              <strong style={{ color: "#991B1B", fontSize: "0.86rem" }}>Reason for previous rejection:</strong>
              <div style={{ color: "#7F1D1D", fontSize: "0.85rem", marginTop: "0.15rem" }}>
                "{worker.rejectionReason}"
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div style={styles.tabsRow}>
          {[
            { id: "overview", label: "Overview & Credentials", Icon: BriefcaseBusiness },
            { id: "portfolio", label: `Work Samples (${worker.portfolio?.length || 0})`, Icon: Images },
            { id: "reviews", label: `Customer Reviews (${worker.reviews?.length || 0})`, Icon: Star },
            { id: "documents", label: `Verification Documents (${(worker.documents?.length || 0) + (worker.certifications?.length || 0)})`, Icon: ShieldCheck },
          ].map((t) => {
            const TabIcon = t.Icon;
            const isSelected = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                style={{
                  ...styles.tabBtn,
                  color: isSelected ? "var(--primary)" : "#64748B",
                  borderColor: isSelected ? "var(--primary)" : "transparent",
                  fontWeight: isSelected ? 700 : 500,
                  background: isSelected ? "#EFF6FF" : "transparent",
                }}
              >
                <TabIcon size={15} color={isSelected ? "var(--primary)" : "#64748B"} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Tab Content Body */}
        <div style={styles.modalBody}>
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Quick Metrics Strip */}
              <div style={styles.metricsGrid}>
                <div style={styles.metricCard}>
                  <div style={styles.metricLabel}>Experience</div>
                  <div style={styles.metricVal}>{worker.experience || 0} Years</div>
                  <div style={styles.metricSub}>Industry background</div>
                </div>
                <div style={styles.metricCard}>
                  <div style={styles.metricLabel}>Standard Hourly Charge</div>
                  <div style={{ ...styles.metricVal, color: "#2563EB" }}>₹{worker.charges || 300}</div>
                  <div style={styles.metricSub}>Direct customer rate</div>
                </div>
                <div style={styles.metricCard}>
                  <div style={styles.metricLabel}>Operating Zone</div>
                  <div style={styles.metricVal}>{worker.location || "Patiala"}</div>
                  <div style={styles.metricSub}>15 km service radius</div>
                </div>
                <div style={styles.metricCard}>
                  <div style={styles.metricLabel}>Working Hours</div>
                  <div style={{ ...styles.metricVal, fontSize: "0.85rem" }}>
                    {worker.workingHours || "8:00 AM - 8:00 PM"}
                  </div>
                  <div style={styles.metricSub}>Mon – Sun Availability</div>
                </div>
              </div>

              {/* Professional Biography */}
              <div style={styles.sectionBox}>
                <h4 style={styles.boxTitle}>
                  <FileText size={15} color="var(--primary)" />
                  <span>Applicant Statement & Biography</span>
                </h4>
                <p style={{ color: "#374151", fontSize: "0.92rem", lineHeight: 1.6, margin: 0 }}>
                  {worker.bio || "No detailed personal biography was submitted during registration."}
                </p>
              </div>

              {/* Skills and Specialties */}
              <div style={styles.sectionBox}>
                <h4 style={styles.boxTitle}>
                  <BadgeCheck size={15} color="var(--primary)" />
                  <span>Specialties & Core Competencies</span>
                </h4>
                {worker.skills && worker.skills.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {worker.skills.map((skill, idx) => (
                      <span key={idx} style={styles.skillPill}>
                        <Check size={13} color="#2563EB" />
                        <span>{skill}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#9CA3AF", fontSize: "0.88rem", margin: 0 }}>
                    Standard {worker.category} skills declared. No specialized tags selected.
                  </p>
                )}
              </div>

              {/* Service Offerings */}
              <div style={styles.sectionBox}>
                <h4 style={styles.boxTitle}>
                  <BriefcaseBusiness size={15} color="var(--primary)" />
                  <span>Configured Services Catalog</span>
                </h4>
                {worker.servicesOffered && worker.servicesOffered.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.75rem" }}>
                    {worker.servicesOffered.map((srv, idx) => {
                      const name = srv.name || srv;
                      const duration = srv.duration || "1–2 hrs";
                      const mult = srv.priceMultiplier || 1.0;
                      const price = Math.round((worker.charges || 300) * mult);
                      return (
                        <div key={idx} style={styles.serviceItem}>
                          <div>
                            <div style={{ fontWeight: 700, color: "#1E293B", fontSize: "0.9rem" }}>{name}</div>
                            <div style={{ fontSize: "0.76rem", color: "#64748B", marginTop: "0.15rem" }}>Typical duration: {duration}</div>
                          </div>
                          <div style={{ fontWeight: 800, color: "#2563EB", fontSize: "0.95rem" }}>
                            ₹{price}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ color: "#9CA3AF", fontSize: "0.88rem", margin: 0 }}>
                    Default {worker.category} services package configured.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: WORK SAMPLES / PORTFOLIO */}
          {activeTab === "portfolio" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0F172A" }}>
                    Work Portfolio & Field Photos
                  </h4>
                  <p style={{ color: "#64748B", fontSize: "0.82rem", margin: "0.15rem 0 0" }}>
                    Photos submitted as proof of technical expertise and completed home visits.
                  </p>
                </div>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#2563EB", background: "#EFF6FF", padding: "0.25rem 0.65rem", borderRadius: "12px" }}>
                  {worker.portfolio?.length || 0} Submitted Photos
                </span>
              </div>

              {!worker.portfolio || worker.portfolio.length === 0 ? (
                <div style={styles.emptyTabBox}>
                  <Images size={40} color="#CBD5E1" />
                  <h5 style={{ margin: "0.75rem 0 0.25rem", color: "#334155", fontWeight: 700 }}>
                    No work samples submitted
                  </h5>
                  <p style={{ color: "#64748B", fontSize: "0.85rem", maxWidth: "380px", margin: "0 auto" }}>
                    This applicant has not uploaded recent work photography yet. You can evaluate their application based on personal verification and credentials.
                  </p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
                  {worker.portfolio.map((job, idx) => (
                    <div key={idx} style={styles.portfolioCard}>
                      <div
                        style={styles.portfolioImgWrapper}
                        onClick={() => setLightboxImg(job.imageUrl)}
                        title="Click to view high resolution photo"
                      >
                        <img
                          src={job.imageUrl}
                          alt={job.title}
                          style={styles.portfolioImg}
                          loading="lazy"
                        />
                        <span style={styles.enlargeOverlay}>
                          <Eye size={16} color="white" />
                          <span>View Full Size</span>
                        </span>
                        {job.serviceType && (
                          <span style={styles.portfolioBadge}>{job.serviceType}</span>
                        )}
                      </div>
                      <div style={{ padding: "0.85rem" }}>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0F172A" }}>{job.title}</div>
                        {job.description && (
                          <div style={{ fontSize: "0.8rem", color: "#64748B", marginTop: "0.25rem", lineHeight: 1.4 }}>
                            {job.description}
                          </div>
                        )}
                        {job.completedDate && (
                          <div style={{ fontSize: "0.72rem", color: "#94A3B8", marginTop: "0.4rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <CalendarDays size={12} />
                            <span>Completed: {job.completedDate}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CUSTOMER REVIEWS */}
          {activeTab === "reviews" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0F172A" }}>
                    Customer Ratings & Historical Reviews
                  </h4>
                  <p style={{ color: "#64748B", fontSize: "0.82rem", margin: "0.15rem 0 0" }}>
                    Authentic customer feedback linked directly to verified jobs in the database.
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "#D97706", fontWeight: 800, fontSize: "0.95rem" }}>
                  <Star size={15} fill="#D97706" color="#D97706" />
                  <span>{parseFloat(worker.rating || 0).toFixed(1)} / 5.0</span>
                </div>
              </div>

              {!worker.reviews || worker.reviews.length === 0 ? (
                <div style={styles.emptyTabBox}>
                  <Star size={40} color="#CBD5E1" />
                  <h5 style={{ margin: "0.75rem 0 0.25rem", color: "#334155", fontWeight: 700 }}>
                    No customer reviews yet
                  </h5>
                  <p style={{ color: "#64748B", fontSize: "0.85rem", maxWidth: "420px", margin: "0 auto", lineHeight: 1.5 }}>
                    This is a new registration. As a new applicant on ServeConnect, they have not completed customer bookings yet. Lack of reviews does not indicate poor quality.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  {worker.reviews.map((rev, idx) => (
                    <div key={idx} style={styles.reviewCard}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 700, color: "#0F172A", fontSize: "0.92rem" }}>{rev.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "#64748B" }}>
                            Verified Homeowner &bull; {rev.date}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "0.15rem" }}>
                          {[...Array(Math.floor(rev.rating || 5))].map((_, i) => (
                            <Star key={i} size={14} fill="#F59E0B" color="#F59E0B" />
                          ))}
                        </div>
                      </div>
                      <p style={{ color: "#374151", fontSize: "0.88rem", margin: "0.4rem 0 0", fontStyle: "italic", lineHeight: 1.5 }}>
                        "{rev.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: VERIFICATION DOCUMENTS */}
          {activeTab === "documents" && (
            <div>
              <div style={{ marginBottom: "1rem" }}>
                <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0F172A" }}>
                  Verification Documents & ID Records
                </h4>
                <p style={{ color: "#64748B", fontSize: "0.82rem", margin: "0.15rem 0 0" }}>
                  Identity proof, background check records, and trade skill certifications.
                </p>
              </div>

              {(!worker.documents || worker.documents.length === 0) && (!worker.certifications || worker.certifications.length === 0) ? (
                <div style={styles.emptyTabBox}>
                  <ShieldCheck size={40} color="#CBD5E1" />
                  <h5 style={{ margin: "0.75rem 0 0.25rem", color: "#334155", fontWeight: 700 }}>
                    No formal document files attached
                  </h5>
                  <p style={{ color: "#64748B", fontSize: "0.85rem", maxWidth: "420px", margin: "0 auto", lineHeight: 1.5 }}>
                    The applicant completed standard online registration with phone and address validation. Formal document uploads can be requested from the partner if required for this category.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {/* Documents List */}
                  {(worker.documents || []).map((doc, idx) => (
                    <div key={idx} style={styles.docItem}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={styles.docIconBox}>
                          <FileText size={18} color="var(--primary)" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "#0F172A", fontSize: "0.9rem" }}>{doc.title}</div>
                          <div style={{ fontSize: "0.76rem", color: "#64748B" }}>
                            Type: {doc.docType || "Verification Document"}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <span style={styles.verifiedTag}>
                          <BadgeCheck size={13} color="#059669" />
                          <span>Submitted</span>
                        </span>
                        {doc.url && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={styles.viewDocLink}
                          >
                            <ExternalLink size={13} />
                            <span>Inspect</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Certifications List */}
                  {(worker.certifications || []).map((cert, idx) => (
                    <div key={`cert-${idx}`} style={styles.docItem}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ ...styles.docIconBox, background: "#ECFDF5" }}>
                          <ShieldCheck size={18} color="#059669" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "#0F172A", fontSize: "0.9rem" }}>{cert}</div>
                          <div style={{ fontSize: "0.76rem", color: "#64748B" }}>Trade Certification / License</div>
                        </div>
                      </div>
                      <span style={styles.verifiedTag}>
                        <CheckCircle2 size={13} color="#059669" />
                        <span>Verified Credential</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Action Decision Footer */}
        <div style={styles.modalFooter}>
          {/* Rejection Input Drawer if active */}
          {showRejectDialog && (
            <form onSubmit={handleRejectSubmit} style={styles.rejectPanel}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <strong style={{ fontSize: "0.88rem", color: "#991B1B", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <XCircle size={15} color="#DC2626" />
                  <span>Specify Rejection Reason for Applicant</span>
                </strong>
                <button
                  type="button"
                  onClick={() => setShowRejectDialog(false)}
                  style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer" }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Quick suggestion pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.5rem" }}>
                {[
                  "Incomplete experience documentation",
                  "Phone number could not be verified",
                  "Pricing outside recommended zone rates",
                  "Service area currently at capacity"
                ].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRejectReason(s)}
                    style={styles.suggestionPill}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <textarea
                rows={2}
                placeholder="Enter feedback or specific reason (sent in notification email)..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
                style={styles.reasonTextarea}
              />

              <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowRejectDialog(false)}
                  style={styles.cancelSmallBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !rejectReason.trim()}
                  style={styles.confirmRejectBtn}
                >
                  {actionLoading ? "Rejecting..." : "Confirm Application Rejection"}
                </button>
              </div>
            </form>
          )}

          {!showRejectDialog && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: "0.75rem" }}>
              <button onClick={onClose} style={styles.secondaryBtn}>
                Close
              </button>

              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                {isPending ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowRejectDialog(true)}
                      disabled={actionLoading}
                      style={styles.rejectActionBtn}
                    >
                      <X size={15} />
                      <span>Reject Application</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleApproveClick}
                      disabled={actionLoading}
                      style={{
                        ...styles.approveActionBtn,
                        background: confirmApprove ? "#047857" : "#10B981"
                      }}
                    >
                      <CheckCircle2 size={16} />
                      <span>{confirmApprove ? "Click Again to Confirm Approval" : "Approve Application"}</span>
                    </button>
                  </>
                ) : isApproved ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "0.85rem", color: "#059669", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <CheckCircle2 size={16} />
                      <span>Worker Profile is Approved & Live</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowRejectDialog(true)}
                      style={styles.reconsiderBtn}
                      title="Revoke approval and reject this application"
                    >
                      Revoke / Reject
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "0.85rem", color: "#DC2626", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                      <XCircle size={16} />
                      <span>Application Rejected</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onApprove(worker._id)}
                      style={styles.reconsiderApproveBtn}
                      title="Reconsider and approve this application"
                    >
                      Reconsider & Approve
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Lightbox Image Preview Modal */}
      {lightboxImg && (
        <div style={styles.lightboxOverlay} onClick={() => setLightboxImg(null)}>
          <div style={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImg} alt="Enlarged Work Portfolio" style={styles.lightboxImg} />
            <button onClick={() => setLightboxImg(null)} style={styles.lightboxCloseBtn}>
              <X size={20} color="white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 23, 42, 0.72)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "1rem",
  },
  modalContainer: {
    width: "100%",
    maxWidth: "920px",
    maxHeight: "92vh",
    background: "#FFFFFF",
    borderRadius: "22px",
    boxShadow: "0 25px 60px -12px rgba(0, 0, 0, 0.3)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    border: "1px solid #E2E8F0",
  },
  modalHeader: {
    padding: "1.25rem 1.75rem",
    borderBottom: "1px solid #E2E8F0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#F8FAFC",
  },
  statusTag: {
    fontSize: "0.76rem",
    fontWeight: 700,
    padding: "0.2rem 0.6rem",
    borderRadius: "20px",
    border: "1px solid",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
  },
  newBadge: {
    fontSize: "0.72rem",
    fontWeight: 800,
    background: "#EFF6FF",
    color: "#2563EB",
    border: "1px solid #BFDBFE",
    padding: "0.2rem 0.55rem",
    borderRadius: "6px",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
    letterSpacing: "0.5px",
  },
  closeBtn: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "white",
    border: "1px solid #CBD5E1",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  identityStrip: {
    padding: "1.5rem 1.75rem",
    background: "white",
    borderBottom: "1px solid #E2E8F0",
    display: "flex",
    alignItems: "center",
    gap: "1.25rem",
    flexWrap: "wrap",
  },
  avatarWrapper: {
    position: "relative",
    width: "72px",
    height: "72px",
    borderRadius: "18px",
    overflow: "hidden",
    flexShrink: 0,
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    color: "white",
    fontSize: "1.8rem",
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryPill: {
    fontSize: "0.75rem",
    fontWeight: 700,
    padding: "0.15rem 0.55rem",
    borderRadius: "12px",
    border: "1px solid",
    display: "inline-flex",
    alignItems: "center",
  },
  contactRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    color: "#475569",
    fontSize: "0.84rem",
    flexWrap: "wrap",
    marginTop: "0.2rem",
  },
  contactItem: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
  },
  rateHighlightBox: {
    marginLeft: "auto",
    background: "#F8FAFC",
    padding: "0.75rem 1.25rem",
    borderRadius: "14px",
    border: "1px solid #E2E8F0",
    textAlign: "right",
  },
  rejectionNotice: {
    padding: "0.75rem 1.75rem",
    background: "#FEF2F2",
    borderBottom: "1px solid #FECACA",
    display: "flex",
    alignItems: "flex-start",
    gap: "0.6rem",
  },
  tabsRow: {
    display: "flex",
    background: "white",
    borderBottom: "1px solid #E2E8F0",
    padding: "0 1.5rem",
    overflowX: "auto",
    gap: "0.5rem",
    flexShrink: 0,
  },
  tabBtn: {
    padding: "0.85rem 1rem",
    border: "none",
    borderBottom: "3px solid transparent",
    fontSize: "0.86rem",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.45rem",
    whiteSpace: "nowrap",
    transition: "all 0.15s ease",
  },
  modalBody: {
    padding: "1.5rem 1.75rem",
    overflowY: "auto",
    flex: 1,
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "0.85rem",
  },
  metricCard: {
    background: "#F8FAFC",
    borderRadius: "12px",
    padding: "0.85rem 1rem",
    border: "1px solid #E2E8F0",
  },
  metricLabel: {
    fontSize: "0.72rem",
    fontWeight: 700,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  metricVal: {
    fontSize: "1.15rem",
    fontWeight: 800,
    color: "#0F172A",
    margin: "0.2rem 0",
  },
  metricSub: {
    fontSize: "0.74rem",
    color: "#94A3B8",
  },
  sectionBox: {
    background: "white",
    border: "1px solid #E2E8F0",
    borderRadius: "14px",
    padding: "1.1rem",
  },
  boxTitle: {
    fontSize: "0.88rem",
    fontWeight: 800,
    color: "#1E293B",
    margin: "0 0 0.75rem 0",
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  skillPill: {
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    padding: "0.3rem 0.65rem",
    fontSize: "0.82rem",
    color: "#334155",
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: "0.3rem",
  },
  serviceItem: {
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "10px",
    padding: "0.75rem 0.85rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  emptyTabBox: {
    padding: "3.5rem 1.5rem",
    textAlign: "center",
    background: "#F8FAFC",
    borderRadius: "16px",
    border: "1.5px dashed #CBD5E1",
  },
  portfolioCard: {
    background: "#F8FAFC",
    borderRadius: "14px",
    border: "1px solid #E2E8F0",
    overflow: "hidden",
  },
  portfolioImgWrapper: {
    position: "relative",
    width: "100%",
    height: "150px",
    cursor: "pointer",
    background: "#E2E8F0",
    overflow: "hidden",
  },
  portfolioImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.25s ease",
  },
  enlargeOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(15, 23, 42, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.3rem",
    color: "white",
    fontSize: "0.75rem",
    fontWeight: 700,
    opacity: 0,
    transition: "opacity 0.2s ease",
  },
  portfolioBadge: {
    position: "absolute",
    top: "0.5rem",
    left: "0.5rem",
    background: "rgba(15, 23, 42, 0.75)",
    color: "white",
    fontSize: "0.7rem",
    fontWeight: 600,
    padding: "0.15rem 0.5rem",
    borderRadius: "6px",
  },
  reviewCard: {
    background: "#F8FAFC",
    borderRadius: "12px",
    border: "1px solid #E2E8F0",
    padding: "1rem",
  },
  docItem: {
    background: "#F8FAFC",
    borderRadius: "12px",
    border: "1px solid #E2E8F0",
    padding: "0.85rem 1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  docIconBox: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "#EFF6FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedTag: {
    fontSize: "0.74rem",
    color: "#059669",
    background: "#ECFDF5",
    padding: "0.2rem 0.55rem",
    borderRadius: "12px",
    border: "1px solid #A7F3D0",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
  },
  viewDocLink: {
    fontSize: "0.76rem",
    fontWeight: 700,
    color: "var(--primary)",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
    padding: "0.3rem 0.6rem",
    borderRadius: "6px",
    background: "white",
    border: "1px solid #CBD5E1",
  },
  modalFooter: {
    padding: "1.15rem 1.75rem",
    borderTop: "1px solid #E2E8F0",
    background: "#F8FAFC",
  },
  secondaryBtn: {
    background: "white",
    border: "1px solid #CBD5E1",
    color: "#475569",
    padding: "0.65rem 1.25rem",
    borderRadius: "10px",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  approveActionBtn: {
    color: "white",
    border: "none",
    padding: "0.65rem 1.4rem",
    borderRadius: "10px",
    fontSize: "0.9rem",
    fontWeight: 700,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.45rem",
    boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)",
  },
  rejectActionBtn: {
    background: "white",
    border: "1.5px solid #FCA5A5",
    color: "#DC2626",
    padding: "0.65rem 1.25rem",
    borderRadius: "10px",
    fontSize: "0.9rem",
    fontWeight: 700,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
  },
  reconsiderBtn: {
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    color: "#DC2626",
    padding: "0.45rem 0.85rem",
    borderRadius: "8px",
    fontSize: "0.8rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  reconsiderApproveBtn: {
    background: "#ECFDF5",
    border: "1px solid #A7F3D0",
    color: "#059669",
    padding: "0.45rem 0.85rem",
    borderRadius: "8px",
    fontSize: "0.8rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  rejectPanel: {
    width: "100%",
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: "12px",
    padding: "0.85rem",
  },
  suggestionPill: {
    background: "white",
    border: "1px solid #FCA5A5",
    color: "#991B1B",
    fontSize: "0.72rem",
    padding: "0.2rem 0.5rem",
    borderRadius: "10px",
    cursor: "pointer",
  },
  reasonTextarea: {
    width: "100%",
    padding: "0.6rem 0.75rem",
    borderRadius: "8px",
    border: "1px solid #FCA5A5",
    fontSize: "0.86rem",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  cancelSmallBtn: {
    background: "white",
    border: "1px solid #CBD5E1",
    color: "#475569",
    padding: "0.4rem 0.85rem",
    borderRadius: "8px",
    fontSize: "0.82rem",
    cursor: "pointer",
  },
  confirmRejectBtn: {
    background: "#DC2626",
    border: "none",
    color: "white",
    padding: "0.45rem 1rem",
    borderRadius: "8px",
    fontSize: "0.84rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  lightboxOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.85)",
    zIndex: 11000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
  },
  lightboxContent: {
    position: "relative",
    maxWidth: "90vw",
    maxHeight: "90vh",
  },
  lightboxImg: {
    maxWidth: "100%",
    maxHeight: "85vh",
    borderRadius: "12px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
  },
  lightboxCloseBtn: {
    position: "absolute",
    top: "-40px",
    right: 0,
    background: "none",
    border: "none",
    cursor: "pointer",
  }
};

