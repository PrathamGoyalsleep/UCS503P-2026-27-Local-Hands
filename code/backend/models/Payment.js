const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        required: true,
        index: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    stripePaymentIntentId: {
        type: String,
        sparse: true,
        index: true
    },
    razorpayOrderId: {
        type: String,
        sparse: true,
        index: true
    },
    razorpayPaymentId: {
        type: String,
        sparse: true
    },
    razorpaySignature: {
        type: String
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: "inr",
        lowercase: true
    },
    status: {
        type: String,
        enum: [
            "requires_payment_method",
            "requires_confirmation",
            "requires_action",
            "processing",
            "succeeded",
            "canceled",
            "failed"
        ],
        default: "requires_payment_method"
    },
    paymentMethod: {
        type: String,
        default: "card"
    },
    paidAt: {
        type: Date
    },
    receiptUrl: {
        type: String
    },
    metadata: {
        type: Object,
        default: {}
    }
}, { timestamps: true });

// Backward-compatible virtual aliases
PaymentSchema.virtual("bookingId").get(function() {
    return this.booking;
});
PaymentSchema.virtual("customerId").get(function() {
    return this.customer;
});

module.exports = mongoose.model("Payment", PaymentSchema);

