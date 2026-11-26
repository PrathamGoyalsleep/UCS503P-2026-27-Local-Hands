import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  createPaymentIntent,
  confirmDemoPayment,
  getPaymentByBooking
} from "../services/paymentService";
import { useAuth } from "../context/AuthContext";
import {
  X,
  CreditCard,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Receipt,
  CalendarDays,
  Clock3,
  Wrench,
  User,
  IndianRupee,
  ExternalLink
} from "./icons";

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_51MockStripePublishableKeyForServeConnect2026";
const stripePromise = loadStripe(stripePublicKey);

// Helper to ensure Razorpay checkout.js script is loaded
function ensureRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function PaymentSuccessReceipt({ booking, paymentSuccess, onClose }) {
  const isRazorpay = paymentSuccess.id?.startsWith("pay_") || paymentSuccess.gateway?.includes("Razorpay");

  return (
    <div style={styles.receiptContainer}>
      <div style={styles.successIconBadge}>
        <CheckCircle2 size={42} color="#059669" />
      </div>
      <h3 style={styles.receiptHeading}>Payment Successful!</h3>
      <p style={styles.receiptSub}>
        Your service payment has been verified and settled securely.
      </p>

      <div style={styles.receiptCard}>
        <div style={styles.receiptRow}>
          <span style={styles.receiptLabel}>Transaction ID</span>
          <span style={{ ...styles.receiptValue, fontFamily: "monospace" }}>
            {paymentSuccess.id}
          </span>
        </div>
        {paymentSuccess.orderId && (
          <div style={styles.receiptRow}>
            <span style={styles.receiptLabel}>Order ID</span>
            <span style={{ ...styles.receiptValue, fontFamily: "monospace", fontSize: "0.85rem" }}>
              {paymentSuccess.orderId}
            </span>
          </div>
        )}
        <div style={styles.receiptRow}>
          <span style={styles.receiptLabel}>Gateway</span>
          <span style={{ ...styles.receiptValue, color: "#1E4E8C", fontWeight: 700 }}>
            {paymentSuccess.gateway || (isRazorpay ? "Razorpay (Test Mode)" : "Stripe")}
          </span>
        </div>
        <div style={styles.receiptRow}>
          <span style={styles.receiptLabel}>Service</span>
          <span style={styles.receiptValue}>{booking.service || "Home Service"}</span>
        </div>
        <div style={styles.receiptRow}>
          <span style={styles.receiptLabel}>Professional</span>
          <span style={styles.receiptValue}>
            {booking.workerId?.userId?.name || booking.worker?.name || "Service Partner"}
          </span>
        </div>
        <div style={styles.receiptRow}>
          <span style={styles.receiptLabel}>Date & Time</span>
          <span style={styles.receiptValue}>{booking.date} at {booking.time}</span>
        </div>
        <div style={{ ...styles.receiptRow, borderTop: "1px dashed #E2E8F0", paddingTop: "0.75rem", marginTop: "0.5rem" }}>
          <span style={{ ...styles.receiptLabel, fontWeight: 700, color: "#0F172A" }}>Amount Paid</span>
          <span style={{ fontSize: "1.35rem", fontWeight: 800, color: "#059669" }}>
            ₹{paymentSuccess.amount || booking.estimatedPrice || 350}
          </span>
        </div>
      </div>

      {isRazorpay && (
        <div style={{ marginTop: "0.75rem", fontSize: "0.82rem", color: "#64748B" }}>
          <span>View this transaction in your </span>
          <a
            href="https://dashboard.razorpay.com/app/payments"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#1E4E8C", fontWeight: 600, textDecoration: "underline" }}
          >
            Razorpay Dashboard &rarr;
          </a>
        </div>
      )}

      <button onClick={onClose} style={styles.doneBtn}>
        Return to My Bookings
      </button>
    </div>
  );
}

function BookingPaymentSummary({ booking, amount }) {
  const hourlyRate = booking.priceBreakdown?.hourlyRate || booking.workerId?.charges || 250;
  const durationHours = booking.priceBreakdown?.durationHours || booking.estimatedHours || 2;
  const serviceCost = booking.priceBreakdown?.serviceCost || (hourlyRate * durationHours);
  const platformFee = booking.priceBreakdown?.platformFee || 0;
  const taxes = booking.priceBreakdown?.taxes || 0;
  const additionalCharges = booking.priceBreakdown?.additionalCharges || 0;
  const totalPayable = amount || booking.priceBreakdown?.totalAmount || booking.estimatedPrice || (serviceCost + platformFee + taxes + additionalCharges);

  return (
    <div style={styles.summaryCard}>
      <div style={styles.summaryRow}>
        <div style={styles.summaryLabelGroup}>
          <User size={15} color="#64748B" />
          <span>Service Professional:</span>
        </div>
        <strong style={{ color: "#0F172A" }}>
          {booking.workerId?.userId?.name || booking.worker?.name || "Professional"}
        </strong>
      </div>

      <div style={styles.summaryRow}>
        <div style={styles.summaryLabelGroup}>
          <Wrench size={15} color="#64748B" />
          <span>Category:</span>
        </div>
        <span style={styles.badge}>{booking.workerId?.category || booking.service}</span>
      </div>

      <div style={styles.summaryRow}>
        <div style={styles.summaryLabelGroup}>
          <CalendarDays size={15} color="#64748B" />
          <span>Appointment:</span>
        </div>
        <span>{booking.date} &middot; {booking.time}</span>
      </div>

      {/* Itemized Payment Table */}
      <div style={{ marginTop: "0.75rem", borderTop: "1px solid #E2E8F0", paddingTop: "0.65rem" }}>
        <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.4rem" }}>
          Itemized Payment Breakdown
        </div>
        <div style={{ ...styles.summaryRow, padding: "0.2rem 0" }}>
          <span style={{ color: "#64748B", fontSize: "0.85rem" }}>Hourly Rate</span>
          <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>₹{hourlyRate}/hr</span>
        </div>
        <div style={{ ...styles.summaryRow, padding: "0.2rem 0" }}>
          <span style={{ color: "#64748B", fontSize: "0.85rem" }}>Service Duration</span>
          <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{durationHours} {durationHours === 1 ? "hour" : "hours"}</span>
        </div>
        <div style={{ ...styles.summaryRow, padding: "0.3rem 0.5rem", background: "#F8FAFC", borderRadius: "6px", margin: "0.2rem 0" }}>
          <span style={{ color: "#334155", fontSize: "0.85rem", fontWeight: 600 }}>Service Cost (₹{hourlyRate} &times; {durationHours}h)</span>
          <strong style={{ color: "#0F172A", fontSize: "0.92rem" }}>₹{serviceCost}</strong>
        </div>
        <div style={{ ...styles.summaryRow, padding: "0.2rem 0" }}>
          <span style={{ color: "#64748B", fontSize: "0.85rem" }}>Platform Fee</span>
          <span style={{ color: "#059669", fontWeight: 600, fontSize: "0.85rem" }}>{platformFee === 0 ? "₹0 (Promo)" : `₹${platformFee}`}</span>
        </div>
        <div style={{ ...styles.summaryRow, padding: "0.2rem 0" }}>
          <span style={{ color: "#64748B", fontSize: "0.85rem" }}>GST / Taxes</span>
          <span style={{ color: "#64748B", fontWeight: 600, fontSize: "0.85rem" }}>{taxes === 0 ? "₹0 (Included)" : `₹${taxes}`}</span>
        </div>
      </div>

      <div style={{ ...styles.summaryRow, borderTop: "1.5px dashed #CBD5E1", paddingTop: "0.75rem", marginTop: "0.5rem" }}>
        <div style={styles.summaryLabelGroup}>
          <Receipt size={16} color="#059669" />
          <strong style={{ color: "#0F172A", fontSize: "1rem" }}>Total Payable:</strong>
        </div>
        <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1E4E8C", display: "flex", alignItems: "center" }}>
          ₹{totalPayable}
        </span>
      </div>
    </div>
  );
}

export default function PaymentModal({ booking, token: propToken, onClose, onPaymentSuccess }) {
  const { token: contextToken, user } = useAuth();
  const token = propToken || contextToken;
  const payableAmount = booking?.priceBreakdown?.totalAmount || booking?.estimatedPrice || ((booking?.workerId?.charges || 250) * (booking?.estimatedHours || 2));

  const [activeTab, setActiveTab] = useState("razorpay"); // "razorpay" | "card"
  const [existingReceipt, setExistingReceipt] = useState(null);
  const [initLoading, setInitLoading] = useState(true);
  const [initError, setInitError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  // Razorpay states
  const [rzpLoading, setRzpLoading] = useState(false);

  // Stripe / Demo states
  const [clientSecret, setClientSecret] = useState(null);
  const [stripePaymentData, setStripePaymentData] = useState(null);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardLoading, setCardLoading] = useState(false);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function checkExistingPayment() {
      if (!booking?._id || !token) return;
      setInitLoading(true);
      setInitError("");

      try {
        if (booking.paymentStatus === "paid" || booking.status === "paid") {
          try {
            const existing = await getPaymentByBooking(booking._id, token);
            if (isMounted) {
              setExistingReceipt(existing);
              setInitLoading(false);
              return;
            }
          } catch {
            if (isMounted) {
              setExistingReceipt({
                id: booking.payment?.razorpayPaymentId || booking.payment?.stripePaymentIntentId || "pay_verified",
                amount: booking.estimatedPrice || 350,
                status: "succeeded",
                paidAt: booking.updatedAt || new Date()
              });
              setInitLoading(false);
              return;
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          setInitError(err.message || "Failed to check booking payment status.");
        }
      } finally {
        if (isMounted) setInitLoading(false);
      }
    }

    checkExistingPayment();

    return () => {
      isMounted = false;
    };
  }, [booking?._id, booking?.paymentStatus, booking?.status, token]);

  // Razorpay Checkout Trigger
  const handlePayWithRazorpay = async () => {
    if (rzpLoading) return;
    setErrorMessage("");
    setRzpLoading(true);

    try {
      const scriptLoaded = await ensureRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Razorpay checkout SDK failed to load. Please check your internet connection.");
      }

      // Step 1: Create Order on backend
      const orderData = await createRazorpayOrder(booking._id, token);

      // Step 2: Open Razorpay Checkout modal
      const options = {
        key: orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TzD2HJ21AaGT8M",
        amount: orderData.amountPaise,
        currency: orderData.currency || "INR",
        name: "ServeConnect",
        description: `${booking.service || "Home Service"} Booking #${booking._id.slice(-6)}`,
        order_id: orderData.orderId,
        prefill: {
          name: user?.name || booking.customerId?.name || "Customer",
          email: user?.email || booking.customerId?.email || "customer@example.com",
          contact: user?.phone || "9999999999"
        },
        theme: {
          color: "#1E4E8C"
        },
        handler: async function (response) {
          try {
            setRzpLoading(true);
            const verified = await verifyRazorpayPayment({
              bookingId: booking._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            }, token);

            const successPayload = {
              id: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              amount: orderData.amount,
              gateway: "Razorpay (Test Mode)",
              paidAt: new Date()
            };

            setPaymentSuccess(successPayload);
            if (onPaymentSuccess) {
              onPaymentSuccess(verified.payment || successPayload);
            }
          } catch (verifyErr) {
            console.error("[Razorpay Verification Error]:", verifyErr);
            setErrorMessage(verifyErr.message || "Payment verification failed on the server.");
          } finally {
            setRzpLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setRzpLoading(false);
          }
        }
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on("payment.failed", function (response) {
        console.warn("[Razorpay Payment Failed]:", response.error);
        setErrorMessage(response.error?.description || "Payment failed or was cancelled.");
        setRzpLoading(false);
      });
      rzpInstance.open();
    } catch (err) {
      console.error("[Razorpay Init Error]:", err);
      setErrorMessage(err.message || "Failed to initialize Razorpay checkout.");
      setRzpLoading(false);
    }
  };

  // Demo card fallback submit
  const handleDemoCardSubmit = async (e) => {
    e.preventDefault();
    if (cardLoading) return;

    const cleanCard = cardNumber.replace(/\s/g, "");
    if (cleanCard.length < 16) {
      setErrorMessage("Please enter a valid 16-digit card number (or click Fill Test Card).");
      return;
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
      setErrorMessage("Please enter a valid expiry date in MM/YY format.");
      return;
    }
    if (cvc.length < 3) {
      setErrorMessage("Please enter a valid 3 or 4 digit CVC.");
      return;
    }

    setCardLoading(true);
    setErrorMessage("");

    try {
      let intentData = stripePaymentData;
      if (!intentData) {
        intentData = await createPaymentIntent(booking._id, token);
        setStripePaymentData(intentData);
      }

      const res = await confirmDemoPayment(booking._id, intentData.paymentIntentId, token);
      const successPayload = {
        id: res.paymentIntent?.id || intentData.paymentIntentId,
        amount: intentData.amount || payableAmount,
        gateway: "Card Simulator",
        paidAt: new Date()
      };
      setPaymentSuccess(successPayload);
      if (onPaymentSuccess) onPaymentSuccess(successPayload);
    } catch (err) {
      setErrorMessage(err.message || "Demo payment confirmation failed.");
    } finally {
      setCardLoading(false);
    }
  };

  const fillTestCard = () => {
    setCardNumber("4242 4242 4242 4242");
    setExpiry("12/28");
    setCvc("424");
    setErrorMessage("");
  };

  if (!booking) return null;

  return createPortal(
    <div style={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={styles.header}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={styles.headerIconWrapper}>
              <CreditCard size={20} color="#1E4E8C" />
            </div>
            <div>
              <h2 style={styles.title}>
                {existingReceipt || paymentSuccess ? "Payment Receipt" : "Secure Booking Payment"}
              </h2>
              <div style={styles.subtitle}>
                <span>Powered by Razorpay</span>
                <span style={styles.badgeStripe}>TEST MODE ACTIVE</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={styles.closeBtn}
            aria-label="Close payment modal"
          >
            <X size={20} color="#64748B" />
          </button>
        </div>

        {/* Modal Body */}
        <div style={styles.body}>
          {initLoading && (
            <div style={styles.centeredState}>
              <Loader2 size={36} color="#1E4E8C" className="animate-spin" />
              <p style={{ marginTop: "1rem", color: "#64748B", fontWeight: 500 }}>
                Loading payment session...
              </p>
            </div>
          )}

          {initError && (
            <div style={styles.centeredState}>
              <AlertTriangle size={42} color="#EF4444" />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1E293B", marginTop: "0.75rem" }}>
                Payment Initialization Failed
              </h3>
              <p style={{ color: "#64748B", fontSize: "0.9rem", maxWidth: "360px", marginTop: "0.4rem" }}>
                {initError}
              </p>
              <button onClick={onClose} style={styles.secondaryBtn}>
                Close
              </button>
            </div>
          )}

          {/* Succeeded Receipt (From fresh payment or existing paid booking) */}
          {!initLoading && !initError && (paymentSuccess || existingReceipt) && (
            <PaymentSuccessReceipt
              booking={booking}
              paymentSuccess={paymentSuccess || {
                id: existingReceipt.razorpayPaymentId || existingReceipt.stripePaymentIntentId || "pay_verified",
                orderId: existingReceipt.razorpayOrderId,
                amount: existingReceipt.amount || payableAmount,
                gateway: existingReceipt.paymentMethod === "razorpay" ? "Razorpay" : "Card Payment",
                paidAt: existingReceipt.paidAt
              }}
              onClose={onClose}
            />
          )}

          {/* Active Payment Form */}
          {!initLoading && !initError && !paymentSuccess && !existingReceipt && (
            <div>
              {errorMessage && (
                <div style={styles.errorAlert}>
                  <AlertTriangle size={18} color="#DC2626" />
                  <span style={{ fontSize: "0.88rem", color: "#B91C1C", fontWeight: 500 }}>
                    {errorMessage}
                  </span>
                </div>
              )}

              <BookingPaymentSummary booking={booking} amount={payableAmount} />

              {/* Payment Method Switcher Tabs */}
              <div style={styles.tabBar}>
                <button
                  type="button"
                  onClick={() => setActiveTab("razorpay")}
                  style={{
                    ...styles.tabBtn,
                    background: activeTab === "razorpay" ? "#FFFFFF" : "transparent",
                    color: activeTab === "razorpay" ? "#1E4E8C" : "#64748B",
                    boxShadow: activeTab === "razorpay" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                    fontWeight: activeTab === "razorpay" ? 700 : 500
                  }}
                >
                  Razorpay (UPI / QR / Cards / NetBanking)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("card")}
                  style={{
                    ...styles.tabBtn,
                    background: activeTab === "card" ? "#FFFFFF" : "transparent",
                    color: activeTab === "card" ? "#1E4E8C" : "#64748B",
                    boxShadow: activeTab === "card" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                    fontWeight: activeTab === "card" ? 700 : 500
                  }}
                >
                  Card Simulator
                </button>
              </div>

              {/* Tab 1: Razorpay Official Checkout */}
              {activeTab === "razorpay" && (
                <div style={{ marginTop: "1rem" }}>
                  <div style={styles.razorpayCardBox}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                      <div style={styles.razorpayIconPill}>
                        <ShieldCheck size={20} color="#1E4E8C" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: "#0F172A", fontSize: "0.95rem" }}>
                          Instant Payment via Razorpay
                        </div>
                        <div style={{ color: "#64748B", fontSize: "0.82rem" }}>
                          Supports UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards, NetBanking, and Wallets.
                        </div>
                      </div>
                    </div>

                    <div style={styles.testModeBanner}>
                      <span style={{ fontWeight: 700 }}>Razorpay Test Mode:</span> Use any UPI ID (e.g. <code>success@razorpay</code>) or test card in popup. No real money will be charged.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePayWithRazorpay}
                    disabled={rzpLoading}
                    style={{
                      ...styles.paySubmitBtn,
                      opacity: rzpLoading ? 0.6 : 1,
                      cursor: rzpLoading ? "not-allowed" : "pointer",
                      marginTop: "1.25rem"
                    }}
                  >
                    {rzpLoading ? (
                      <>
                        <Loader2 size={18} color="white" className="animate-spin" />
                        <span>Opening Razorpay Checkout...</span>
                      </>
                    ) : (
                      <>
                        <Lock size={16} color="white" />
                        <span>Pay ₹{payableAmount} with Razorpay</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Tab 2: Card Simulator Fallback */}
              {activeTab === "card" && (
                <form onSubmit={handleDemoCardSubmit} style={{ marginTop: "1rem" }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.5rem",
                    padding: "0.65rem 0.85rem",
                    background: "#EEF4FB",
                    border: "1px solid #D5E1F0",
                    borderRadius: "10px",
                    fontSize: "0.8rem",
                    color: "#1E40AF",
                    marginBottom: "1rem"
                  }}>
                    <span><strong>Card Simulator:</strong> Rapid test checkout</span>
                    <button
                      type="button"
                      onClick={fillTestCard}
                      style={{
                        background: "#1E4E8C",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: "6px",
                        padding: "0.3rem 0.6rem",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        flexShrink: 0
                      }}
                    >
                      Fill Test Card
                    </button>
                  </div>

                  <div style={styles.cardInputWrapper}>
                    <label style={styles.cardInputLabel}>
                      <CreditCard size={16} color="#475569" />
                      <span>Card Details</span>
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="4242 4242 4242 4242"
                        value={cardNumber}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                          setCardNumber(digits.replace(/(\d{4})(?=\d)/g, "$1 "));
                          if (errorMessage) setErrorMessage("");
                        }}
                        disabled={cardLoading}
                        style={styles.inputField}
                        aria-label="Card number"
                      />
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="MM/YY"
                          value={expiry}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                            setExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
                            if (errorMessage) setErrorMessage("");
                          }}
                          disabled={cardLoading}
                          style={styles.inputField}
                          aria-label="Expiry date"
                        />
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="CVC"
                          value={cvc}
                          onChange={(e) => {
                            setCvc(e.target.value.replace(/\D/g, "").slice(0, 4));
                            if (errorMessage) setErrorMessage("");
                          }}
                          disabled={cardLoading}
                          style={styles.inputField}
                          aria-label="CVC"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={cardLoading}
                    style={{
                      ...styles.paySubmitBtn,
                      opacity: cardLoading ? 0.6 : 1,
                      cursor: cardLoading ? "not-allowed" : "pointer",
                      marginTop: "1.25rem"
                    }}
                  >
                    {cardLoading ? (
                      <>
                        <Loader2 size={18} color="white" className="animate-spin" />
                        <span>Processing Payment...</span>
                      </>
                    ) : (
                      <>
                        <Lock size={16} color="white" />
                        <span>Pay ₹{payableAmount} via Card</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              <div style={styles.securityHint}>
                <Lock size={12} color="#059669" />
                <span>256-bit encrypted test sandbox • Safe for project evaluations</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 23, 42, 0.65)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "0.75rem",
    overflowY: "auto",
  },
  modal: {
    width: "100%",
    maxWidth: "520px",
    maxHeight: "92vh",
    display: "flex",
    flexDirection: "column",
    background: "#FFFFFF",
    borderRadius: "20px",
    boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
    border: "1px solid #E2E8F0",
    overflow: "hidden",
    boxSizing: "border-box"
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1.1rem clamp(1rem, 3vw, 1.75rem)",
    borderBottom: "1px solid #F1F5F9",
    background: "#FFFFFF",
    flexShrink: 0,
  },
  headerIconWrapper: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    background: "#EEF4FB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: "1.15rem",
    fontWeight: 800,
    color: "#0F172A",
    letterSpacing: "-0.01em"
  },
  subtitle: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginTop: "0.2rem",
    fontSize: "0.78rem",
    color: "#64748B",
    flexWrap: "wrap",
  },
  badgeStripe: {
    background: "#DCFCE7",
    color: "#15803D",
    fontSize: "0.68rem",
    fontWeight: 700,
    padding: "0.15rem 0.45rem",
    borderRadius: "4px",
    letterSpacing: "0.04em"
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: "0.35rem",
    color: "#64748B",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  body: {
    padding: "1.25rem clamp(1rem, 3vw, 1.75rem)",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    flex: 1,
  },
  centeredState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "2.5rem 1rem",
    textAlign: "center"
  },
  summaryCard: {
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "14px",
    padding: "1rem 1.25rem",
    marginBottom: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem"
  },
  summaryRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: "0.88rem",
    color: "#475569"
  },
  summaryLabelGroup: {
    display: "flex",
    alignItems: "center",
    gap: "0.45rem"
  },
  badge: {
    background: "#EEF4FB",
    color: "#1E4E8C",
    fontWeight: 600,
    fontSize: "0.78rem",
    padding: "0.2rem 0.55rem",
    borderRadius: "6px"
  },
  tabBar: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "0.35rem",
    background: "#F1F5F9",
    padding: "0.3rem",
    borderRadius: "12px",
    marginTop: "1rem"
  },
  tabBtn: {
    border: "none",
    padding: "0.6rem 0.5rem",
    borderRadius: "9px",
    fontSize: "0.8rem",
    cursor: "pointer",
    transition: "all 0.15s ease",
    textAlign: "center"
  },
  razorpayCardBox: {
    background: "#F8FAFC",
    border: "1.5px solid #D5E1F0",
    borderRadius: "12px",
    padding: "1rem 1.15rem"
  },
  razorpayIconPill: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    background: "#EEF4FB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  testModeBanner: {
    fontSize: "0.78rem",
    color: "#334155",
    background: "#FFFFFF",
    padding: "0.5rem 0.75rem",
    borderRadius: "6px",
    border: "1px dashed #CBD5E1"
  },
  cardInputWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem"
  },
  cardInputLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#1E293B"
  },
  inputField: {
    width: "100%",
    height: "44px",
    padding: "0 0.85rem",
    background: "#F8FAFC",
    border: "1.5px solid #E2E8F0",
    borderRadius: "10px",
    fontSize: "0.92rem",
    color: "#0F172A",
    outline: "none",
    boxSizing: "border-box"
  },
  securityHint: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.4rem",
    fontSize: "0.78rem",
    color: "#64748B",
    marginTop: "1rem"
  },
  paySubmitBtn: {
    width: "100%",
    height: "48px",
    background: "#1E4E8C",
    color: "#FFFFFF",
    fontSize: "0.98rem",
    fontWeight: 700,
    borderRadius: "10px",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.55rem",
    boxShadow: "0 4px 14px rgba(30, 78, 140, 0.35)",
    transition: "all 0.15s ease"
  },
  errorAlert: {
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    padding: "0.75rem 1rem",
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: "10px",
    marginBottom: "1rem"
  },
  receiptContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "1rem 0"
  },
  successIconBadge: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    background: "#ECFDF5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "1rem",
    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)"
  },
  receiptHeading: {
    fontSize: "1.35rem",
    fontWeight: 800,
    color: "#0F172A",
    margin: "0 0 0.3rem"
  },
  receiptSub: {
    fontSize: "0.88rem",
    color: "#64748B",
    margin: "0 0 1.25rem"
  },
  receiptCard: {
    width: "100%",
    background: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "14px",
    padding: "1.15rem 1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.65rem",
    marginBottom: "1.25rem",
    textAlign: "left"
  },
  receiptRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: "0.86rem"
  },
  receiptLabel: {
    color: "#64748B",
    fontWeight: 500
  },
  receiptValue: {
    color: "#0F172A",
    fontWeight: 600
  },
  doneBtn: {
    width: "100%",
    height: "46px",
    background: "#1E4E8C",
    color: "#FFFFFF",
    fontSize: "0.95rem",
    fontWeight: 700,
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    marginTop: "0.75rem"
  },
  secondaryBtn: {
    background: "#F1F5F9",
    color: "#334155",
    border: "none",
    borderRadius: "8px",
    padding: "0.5rem 1rem",
    fontSize: "0.85rem",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "1rem"
  }
};
