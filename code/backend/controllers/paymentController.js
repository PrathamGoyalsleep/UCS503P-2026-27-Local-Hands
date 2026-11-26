const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Worker = require("../models/Worker");
const { getStripe, isDemoStripeMode } = require("../config/stripe");
const {
    createRazorpayOrder,
    verifyRazorpaySignature,
    getRazorpayCredentials
} = require("../config/razorpay");

/**
 * POST /api/payments/create-payment-intent
 * Initiates a Stripe PaymentIntent for a completed booking.
 */
const createPaymentIntent = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const customerId = req.user._id ? req.user._id.toString() : req.user.id;

        if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ message: "Valid booking ID is required." });
        }

        const booking = await Booking.findById(bookingId).populate("workerId");
        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        // Authorization: Only the booking's customer can initiate payment
        const bookingCustomerId = booking.customerId?._id 
            ? booking.customerId._id.toString() 
            : booking.customerId.toString();

        if (bookingCustomerId !== customerId) {
            return res.status(403).json({ message: "You are not authorized to pay for this booking." });
        }

        // Eligibility check: Booking must be accepted or completed (payment allowed from accepted stage)
        if (booking.status === "paid" || booking.paymentStatus === "paid") {
            return res.status(400).json({ message: "This booking has already been paid for." });
        }

        if (!["accepted", "completed"].includes(booking.status)) {
            return res.status(400).json({ 
                message: `Booking is not eligible for payment. Current status: ${booking.status}. Only accepted or completed bookings can be paid.` 
            });
        }

        // Duplicate payment check in Payment collection
        const existingSucceededPayment = await Payment.findOne({
            booking: booking._id,
            status: "succeeded"
        });

        if (existingSucceededPayment) {
            // Self-heal booking status if it was out of sync
            booking.paymentStatus = "paid";
            booking.status = "paid";
            booking.payment = existingSucceededPayment._id;
            await booking.save();
            return res.status(400).json({ message: "This booking has already been paid for." });
        }

        // Calculate amount strictly on the server from trusted database records (Never trust client amount)
        let amountInRupees = Number(booking.priceBreakdown?.totalAmount || booking.estimatedPrice);
        if (!amountInRupees || isNaN(amountInRupees) || amountInRupees <= 0) {
            const workerCharges = booking.workerId?.charges || 250;
            const hours = booking.estimatedHours || 2;
            amountInRupees = workerCharges * hours;
        }

        // Ensure minimum amount
        if (amountInRupees < 50) amountInRupees = 50;

        const amountInPaise = Math.round(amountInRupees * 100);
        const currency = "inr";

        const stripe = getStripe();

        // Check if an existing open payment record exists for this booking that we can reuse
        let paymentRecord = await Payment.findOne({
            booking: booking._id,
            status: { $in: ["requires_payment_method", "requires_confirmation", "requires_action"] }
        });

        let paymentIntent;

        if (paymentRecord && paymentRecord.stripePaymentIntentId) {
            try {
                paymentIntent = await stripe.paymentIntents.retrieve(paymentRecord.stripePaymentIntentId);
                // If it's already succeeded or canceled, handle appropriately
                if (paymentIntent.status === "succeeded") {
                    paymentRecord.status = "succeeded";
                    paymentRecord.paidAt = new Date();
                    await paymentRecord.save();

                    booking.paymentStatus = "paid";
                    booking.status = "paid";
                    booking.payment = paymentRecord._id;
                    await booking.save();

                    return res.status(400).json({ message: "This booking has already been paid for." });
                }
            } catch (retrieveErr) {
                console.warn("[Stripe] Could not retrieve existing intent, creating new one:", retrieveErr.message);
                paymentRecord = null;
            }
        }

        if (!paymentRecord || !paymentIntent) {
            const idempotencyKey = `pay_intent_booking_${booking._id.toString()}_${Date.now()}`;

            paymentIntent = await stripe.paymentIntents.create({
                amount: amountInPaise,
                currency,
                description: `ServeConnect Payment for Booking #${booking._id}`,
                metadata: {
                    bookingId: booking._id.toString(),
                    customerId: customerId,
                    workerId: (booking.workerId?._id || booking.workerId).toString(),
                    service: booking.service || "Home Service"
                },
                automatic_payment_methods: {
                    enabled: true,
                }
            }, {
                idempotencyKey
            });

            paymentRecord = await Payment.create({
                booking: booking._id,
                customer: customerId,
                stripePaymentIntentId: paymentIntent.id,
                amount: amountInRupees,
                currency,
                status: paymentIntent.status,
                metadata: {
                    service: booking.service,
                    date: booking.date,
                    time: booking.time
                }
            });
        }

        // Set booking paymentStatus to pending
        booking.paymentStatus = "pending";
        booking.payment = paymentRecord._id;
        await booking.save();

        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: amountInRupees,
            currency,
            demoMode: typeof isDemoStripeMode === "function" ? isDemoStripeMode() : false,
            booking: {
                _id: booking._id,
                service: booking.service,
                date: booking.date,
                time: booking.time,
                amount: amountInRupees,
                priceBreakdown: booking.priceBreakdown,
                workerName: booking.workerId?.userId?.name || "Professional",
                category: booking.workerId?.category || "Home Services"
            }
        });
    } catch (error) {
        console.error("[Payment] createPaymentIntent error:", error);
        res.status(500).json({ message: error.message || "Failed to create payment intent." });
    }
};

/**
 * POST /api/payments/webhook
 * Handles incoming verified Stripe events.
 */
const handleWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    const stripe = getStripe();
    let event;

    try {
        const rawPayload = req.rawBody || req.body;
        if (!webhookSecret) {
            // In dev/test when webhook secret is not set, allow parsing from raw or JSON
            console.warn("[Stripe Webhook] No STRIPE_WEBHOOK_SECRET provided. Running in test verification mode.");
            event = typeof rawPayload === "string" ? JSON.parse(rawPayload) : (req.body || rawPayload);
        } else {
            event = stripe.webhooks.constructEvent(rawPayload, sig, webhookSecret);
        }
    } catch (err) {
        console.error(`[Stripe Webhook Error] ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object;
                const bookingId = paymentIntent.metadata?.bookingId;

                const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
                if (payment) {
                    payment.status = "succeeded";
                    payment.paidAt = new Date();
                    payment.paymentMethod = paymentIntent.payment_method_types?.[0] || "card";
                    if (paymentIntent.charges?.data?.[0]?.receipt_url) {
                        payment.receiptUrl = paymentIntent.charges.data[0].receipt_url;
                    }
                    await payment.save();

                    await Booking.findByIdAndUpdate(payment.booking, {
                        paymentStatus: "paid",
                        status: "paid",
                        payment: payment._id
                    });
                } else if (bookingId) {
                    // Create payment record if missing
                    const newPayment = await Payment.create({
                        booking: bookingId,
                        customer: paymentIntent.metadata?.customerId,
                        stripePaymentIntentId: paymentIntent.id,
                        amount: (paymentIntent.amount || 0) / 100,
                        currency: paymentIntent.currency || "inr",
                        status: "succeeded",
                        paidAt: new Date(),
                        paymentMethod: paymentIntent.payment_method_types?.[0] || "card"
                    });

                    await Booking.findByIdAndUpdate(bookingId, {
                        paymentStatus: "paid",
                        status: "paid",
                        payment: newPayment._id
                    });
                }
                break;
            }

            case "payment_intent.payment_failed": {
                const paymentIntent = event.data.object;
                const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
                if (payment) {
                    payment.status = "failed";
                    await payment.save();

                    await Booking.findByIdAndUpdate(payment.booking, {
                        paymentStatus: "unpaid"
                    });
                }
                break;
            }

            default:
                // Ignore other events safely
                break;
        }

        res.status(200).json({ received: true });
    } catch (err) {
        console.error("[Stripe Webhook Processing Error]:", err);
        res.status(500).json({ message: "Webhook handler failed" });
    }
};

/**
 * GET /api/payments/booking/:bookingId
 * Returns the payment record for a given booking.
 */
const getPaymentByBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.user._id ? req.user._id.toString() : req.user.id;
        const userRole = req.user.role;

        if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ message: "Invalid booking ID." });
        }

        const booking = await Booking.findById(bookingId).populate("workerId");
        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        const isCustomer = (booking.customerId?._id || booking.customerId).toString() === userId;
        const isWorker = booking.workerId?.userId?.toString() === userId;
        const isAdmin = userRole === "admin";

        if (!isCustomer && !isWorker && !isAdmin) {
            return res.status(403).json({ message: "Not authorized to view payments for this booking." });
        }

        const payment = await Payment.findOne({ booking: booking._id })
            .populate("customer", "name email")
            .sort({ createdAt: -1 });

        if (!payment) {
            return res.status(404).json({ message: "No payment record found for this booking." });
        }

        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * GET /api/payments/:paymentId
 * Retrieve a payment record by ID.
 */
const getPaymentById = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const userId = req.user._id ? req.user._id.toString() : req.user.id;
        const userRole = req.user.role;

        if (!paymentId || !mongoose.Types.ObjectId.isValid(paymentId)) {
            return res.status(400).json({ message: "Invalid payment ID." });
        }

        const payment = await Payment.findById(paymentId)
            .populate("customer", "name email phone")
            .populate({
                path: "booking",
                populate: { path: "workerId", populate: { path: "userId", select: "name email phone" } }
            });

        if (!payment) {
            return res.status(404).json({ message: "Payment not found." });
        }

        const isOwner = (payment.customer?._id || payment.customer).toString() === userId;
        const isAdmin = userRole === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: "Not authorized to access this payment record." });
        }

        res.json(payment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * POST /api/payments/confirm-demo
 * Confirms a simulated demo payment when Stripe is running in local demo mode.
 */
const confirmDemoPayment = async (req, res) => {
    try {
        if (typeof isDemoStripeMode !== "function" || !isDemoStripeMode()) {
            return res.status(403).json({
                message: "Demo payment confirmation is disabled when live/test Stripe keys are active."
            });
        }

        const { bookingId, paymentIntentId } = req.body;
        const customerId = req.user._id ? req.user._id.toString() : req.user.id;

        if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ message: "Valid booking ID is required." });
        }

        if (!paymentIntentId) {
            return res.status(400).json({ message: "PaymentIntent ID is required." });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        const bookingCustomerId = booking.customerId?._id
            ? booking.customerId._id.toString()
            : booking.customerId.toString();

        if (bookingCustomerId !== customerId) {
            return res.status(403).json({ message: "You are not authorized to pay for this booking." });
        }

        if (booking.status === "paid" || booking.paymentStatus === "paid") {
            return res.status(400).json({ message: "This booking has already been paid for." });
        }

        const payment = await Payment.findOne({
            booking: booking._id,
            stripePaymentIntentId: paymentIntentId
        });

        if (!payment) {
            return res.status(404).json({ message: "Payment session not found for this booking." });
        }

        payment.status = "succeeded";
        payment.paidAt = new Date();
        payment.paymentMethod = "card";
        payment.receiptUrl = `#demo-receipt-${paymentIntentId}`;
        await payment.save();

        booking.paymentStatus = "paid";
        booking.status = "paid";
        booking.payment = payment._id;
        await booking.save();

        res.status(200).json({
            paymentIntent: {
                id: payment.stripePaymentIntentId,
                status: "succeeded",
                amount: Math.round(payment.amount * 100),
                currency: payment.currency || "inr"
            },
            payment,
            booking
        });
    } catch (error) {
        console.error("[Payment] confirmDemoPayment error:", error);
        res.status(500).json({ message: error.message || "Failed to confirm demo payment." });
    }
};

/**
 * POST /api/payments/razorpay/create-order
 * Creates an authorized Razorpay Order for a completed booking.
 */
const createRazorpayOrderHandler = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const customerId = req.user._id ? req.user._id.toString() : req.user.id;

        if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ message: "Valid booking ID is required." });
        }

        const booking = await Booking.findById(bookingId).populate("workerId");
        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        // Authorization: Only customer who made the booking can pay
        const bookingCustomerId = booking.customerId?._id 
            ? booking.customerId._id.toString() 
            : booking.customerId.toString();

        if (bookingCustomerId !== customerId) {
            return res.status(403).json({ message: "You are not authorized to pay for this booking." });
        }

        if (booking.status === "paid" || booking.paymentStatus === "paid") {
            return res.status(400).json({ message: "This booking has already been paid for." });
        }

        if (!["accepted", "completed"].includes(booking.status)) {
            return res.status(400).json({ 
                message: `Booking is not eligible for payment. Current status: ${booking.status}. Only accepted or completed bookings can be paid.` 
            });
        }

        // Duplicate check
        const existingSucceededPayment = await Payment.findOne({
            booking: booking._id,
            status: "succeeded"
        });

        if (existingSucceededPayment) {
            booking.paymentStatus = "paid";
            booking.status = "paid";
            booking.payment = existingSucceededPayment._id;
            await booking.save();
            return res.status(400).json({ message: "This booking has already been paid for." });
        }

        // Calculate amount strictly on server from trusted database records
        let amountInRupees = Number(booking.priceBreakdown?.totalAmount || booking.estimatedPrice);
        if (!amountInRupees || isNaN(amountInRupees) || amountInRupees <= 0) {
            const workerCharges = booking.workerId?.charges || 250;
            const hours = booking.estimatedHours || 2;
            amountInRupees = workerCharges * hours;
        }

        if (amountInRupees < 50) amountInRupees = 50;

        const amountInPaise = Math.round(amountInRupees * 100);
        const { keyId } = getRazorpayCredentials();

        // Create order via Razorpay API
        const order = await createRazorpayOrder({
            amount: amountInPaise,
            currency: "INR",
            receipt: `b_${booking._id.toString().slice(-10)}_${Date.now().toString().slice(-6)}`,
            notes: {
                bookingId: booking._id.toString(),
                customerId: customerId,
                workerId: (booking.workerId?._id || booking.workerId).toString(),
                service: booking.service || "Home Service"
            }
        });

        // Upsert open payment record
        let paymentRecord = await Payment.findOne({
            booking: booking._id,
            status: { $in: ["requires_payment_method", "requires_confirmation", "processing"] }
        });

        if (paymentRecord) {
            paymentRecord.razorpayOrderId = order.id;
            paymentRecord.stripePaymentIntentId = order.id;
            paymentRecord.amount = amountInRupees;
            paymentRecord.currency = "inr";
            paymentRecord.paymentMethod = "razorpay";
            await paymentRecord.save();
        } else {
            paymentRecord = await Payment.create({
                booking: booking._id,
                customer: customerId,
                razorpayOrderId: order.id,
                stripePaymentIntentId: order.id,
                amount: amountInRupees,
                currency: "inr",
                status: "requires_payment_method",
                paymentMethod: "razorpay",
                metadata: {
                    service: booking.service,
                    date: booking.date,
                    time: booking.time
                }
            });
        }

        booking.paymentStatus = "pending";
        booking.payment = paymentRecord._id;
        await booking.save();

        res.status(200).json({
            orderId: order.id,
            amount: amountInRupees,
            amountPaise: order.amount,
            currency: order.currency,
            keyId: keyId,
            booking: {
                _id: booking._id,
                service: booking.service,
                date: booking.date,
                time: booking.time,
                amount: amountInRupees,
                priceBreakdown: booking.priceBreakdown,
                workerName: booking.workerId?.userId?.name || "Professional",
                category: booking.workerId?.category || "Home Services"
            }
        });
    } catch (error) {
        console.error("[Razorpay] createOrder error:", error);
        res.status(500).json({ message: error.message || "Failed to initialize Razorpay order." });
    }
};

/**
 * POST /api/payments/razorpay/verify
 * Verifies Razorpay payment signature and updates booking to paid.
 */
const verifyRazorpayPaymentHandler = async (req, res) => {
    try {
        const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
        const customerId = req.user._id ? req.user._id.toString() : req.user.id;

        if (!bookingId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({ 
                message: "Missing required payment verification parameters." 
            });
        }

        const booking = await Booking.findById(bookingId).populate("workerId");
        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        const bookingCustomerId = booking.customerId?._id 
            ? booking.customerId._id.toString() 
            : booking.customerId.toString();

        if (bookingCustomerId !== customerId) {
            return res.status(403).json({ message: "You are not authorized to verify this payment." });
        }

        // Verify cryptographic signature
        const isValid = verifyRazorpaySignature({
            orderId: razorpayOrderId,
            paymentId: razorpayPaymentId,
            signature: razorpaySignature
        });

        if (!isValid) {
            console.error(`[Razorpay Signature Verification Failed] for order ${razorpayOrderId}`);
            return res.status(400).json({ message: "Payment verification failed: Invalid signature." });
        }

        // Find payment record
        let payment = await Payment.findOne({
            booking: booking._id,
            $or: [
                { razorpayOrderId: razorpayOrderId },
                { stripePaymentIntentId: razorpayOrderId }
            ]
        });

        if (!payment) {
            payment = await Payment.create({
                booking: booking._id,
                customer: customerId,
                razorpayOrderId: razorpayOrderId,
                razorpayPaymentId: razorpayPaymentId,
                razorpaySignature: razorpaySignature,
                stripePaymentIntentId: razorpayOrderId,
                amount: booking.estimatedPrice || 350,
                currency: "inr",
                status: "succeeded",
                paymentMethod: "razorpay",
                paidAt: new Date()
            });
        } else {
            payment.status = "succeeded";
            payment.razorpayPaymentId = razorpayPaymentId;
            payment.razorpaySignature = razorpaySignature;
            payment.paymentMethod = "razorpay";
            payment.paidAt = new Date();
            payment.receiptUrl = `https://dashboard.razorpay.com/app/payments/${razorpayPaymentId}`;
            await payment.save();
        }

        booking.paymentStatus = "paid";
        booking.status = "paid";
        booking.payment = payment._id;
        await booking.save();

        res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            payment: {
                id: payment.razorpayPaymentId || payment._id,
                orderId: payment.razorpayOrderId,
                amount: payment.amount,
                status: "succeeded",
                paidAt: payment.paidAt
            },
            booking
        });
    } catch (error) {
        console.error("[Razorpay] verifyPayment error:", error);
        res.status(500).json({ message: error.message || "Failed to verify payment." });
    }
};

module.exports = {
    createPaymentIntent,
    confirmDemoPayment,
    createRazorpayOrderHandler,
    verifyRazorpayPaymentHandler,
    handleWebhook,
    getPaymentByBooking,
    getPaymentById
};

