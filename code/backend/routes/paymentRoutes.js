const express = require("express");
const router = express.Router();
const {
    createPaymentIntent,
    confirmDemoPayment,
    createRazorpayOrderHandler,
    verifyRazorpayPaymentHandler,
    handleWebhook,
    getPaymentByBooking,
    getPaymentById
} = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

// Stripe webhook route — must receive raw body for signature verification
router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

// Protected routes
router.post("/create-payment-intent", protect, createPaymentIntent);
router.post("/confirm-demo", protect, confirmDemoPayment);

// Razorpay routes
router.post("/razorpay/create-order", protect, createRazorpayOrderHandler);
router.post("/razorpay/verify", protect, verifyRazorpayPaymentHandler);
router.get("/booking/:bookingId", protect, getPaymentByBooking);
router.get("/:paymentId", protect, getPaymentById);

module.exports = router;

