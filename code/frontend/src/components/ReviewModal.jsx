import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createReview } from "../services/reviewService";
import {
  X,
  Star,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  User,
  Wrench,
  CalendarDays
} from "./icons";

const FONT = "'Manrope', 'Inter', system-ui, sans-serif";

export default function ReviewModal({ booking, token, onClose, onReviewSuccess }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!booking) return null;

  const workerName = booking.workerId?.userId?.name || booking.worker?.name || "Professional";
  const serviceCategory = booking.workerId?.category || booking.service || "Home Service";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!rating || rating < 1 || rating > 5) {
      setErrorMessage("Please select a rating between 1 and 5 stars.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      await createReview(
        {
          bookingId: booking._id,
          rating,
          comment: comment.trim()
        },
        token
      );

      setSubmitted(true);
      if (onReviewSuccess) {
        onReviewSuccess();
      }
    } catch (err) {
      console.error("[Review Submission Error]:", err);
      setErrorMessage(err.message || "Failed to submit review.");
    } finally {
      setLoading(false);
    }
  };

  const ratingLabels = { 5: "Excellent (5.0)", 4: "Very Good (4.0)", 3: "Average (3.0)", 2: "Poor (2.0)", 1: "Terrible (1.0)" };

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
        fontFamily: FONT,
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "480px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          border: "1px solid #E5E7EB",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.1rem 1.5rem",
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: "#F5F0E8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Star size={20} color="#B45309" fill="#B45309" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#1F2937" }}>Rate & Review Service</h2>
              <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.78rem", color: "#4B5563" }}>Share your verified experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close review dialog"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "0.35rem",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#4B5563",
            }}
          >
            <X size={20} color="#4B5563" />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            flex: 1,
          }}
        >
          {submitted ? (
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <div
                style={{
                  width: "68px",
                  height: "68px",
                  borderRadius: "50%",
                  background: "#EDF5F0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 1rem",
                }}
              >
                <CheckCircle2 size={44} color="#16A34A" />
              </div>
              <h3 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1F2937", margin: "0 0 0.4rem 0" }}>Review Submitted!</h3>
              <p style={{ fontSize: "0.9rem", color: "#4B5563", lineHeight: 1.5, margin: "0 0 1.5rem 0" }}>
                Thank you for your feedback! Your review helps other homeowners find trusted professionals on ServeConnect.
              </p>
              <button
                onClick={onClose}
                style={{
                  width: "100%",
                  background: "#2563EB",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "10px",
                  padding: "0.85rem 1rem",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: FONT,
                }}
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {errorMessage && (
                <div
                  style={{
                    background: "#F5ECEC",
                    border: "1px solid #E8D0D0",
                    borderRadius: "10px",
                    padding: "0.75rem 1rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <AlertTriangle size={18} color="#B34F52" />
                  <span style={{ fontSize: "0.88rem", color: "#B34F52", fontWeight: 500 }}>{errorMessage}</span>
                </div>
              )}

              {/* Context rows */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  fontSize: "0.85rem",
                }}
              >
                {[
                  { icon: <User size={15} color="#4B5563" />, label: "Professional:", value: workerName },
                  { icon: <Wrench size={15} color="#4B5563" />, label: "Service:", value: serviceCategory, badge: true },
                  { icon: <CalendarDays size={15} color="#4B5563" />, label: "Completed on:", value: `${booking.date} at ${booking.time}` },
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: i < 2 ? "1px solid #E5E7EB" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#4B5563" }}>
                      {row.icon}
                      <span>{row.label}</span>
                    </div>
                    {row.badge ? (
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, background: "#EFF6FF", color: "#2563EB", padding: "0.15rem 0.55rem", borderRadius: "6px" }}>{row.value}</span>
                    ) : (
                      <strong style={{ color: "#1F2937" }}>{row.value}</strong>
                    )}
                  </div>
                ))}
              </div>

              {/* Star rating */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1F2937" }}>Overall Rating</label>
                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const isFilled = (hoverRating || rating) >= starValue;
                    return (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() => setRating(starValue)}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(0)}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "0.2rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "transform 0.1s ease",
                        }}
                        aria-label={`Rate ${starValue} of 5 stars`}
                      >
                        <Star
                          size={32}
                          color={isFilled ? "#B45309" : "#E5E7EB"}
                          fill={isFilled ? "#B45309" : "none"}
                        />
                      </button>
                    );
                  })}
                  <span style={{ marginLeft: "0.5rem", fontSize: "0.88rem", fontWeight: 600, color: "#B45309" }}>
                    {ratingLabels[rating] || ""}
                  </span>
                </div>
              </div>

              {/* Textarea */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label htmlFor="review-comment" style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1F2937" }}>
                  Written Feedback (Optional)
                </label>
                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about the quality of work, punctuality, and professionalism..."
                  rows={4}
                  maxLength={1000}
                  style={{
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    padding: "0.75rem 1rem",
                    fontSize: "0.9rem",
                    fontFamily: FONT,
                    outline: "none",
                    resize: "vertical",
                    color: "#1F2937",
                    background: "#FFFFFF",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                />
                <span style={{ fontSize: "0.75rem", color: "#6B7280", textAlign: "right" }}>{comment.length}/1000 characters</span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: "#2563EB",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "10px",
                  padding: "0.85rem 1.25rem",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  fontFamily: FONT,
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} color="white" />
                    <span>Submitting Review...</span>
                  </>
                ) : (
                  <span>Submit Verified Review</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
