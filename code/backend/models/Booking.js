const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker',
        required: true,
        index: true
    },
    service: {
        type: String
    },
    date: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    address: {
        type: String
    },
    estimatedHours: {
        type: Number,
        default: 1
    },
    estimatedPrice: {
        type: Number
    },
    priceBreakdown: {
        hourlyRate: { type: Number },
        durationHours: { type: Number },
        serviceCost: { type: Number },
        platformFee: { type: Number, default: 0 },
        taxes: { type: Number, default: 0 },
        additionalCharges: { type: Number, default: 0 },
        totalAmount: { type: Number }
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'completed', 'paid'],
        default: 'pending'
    },
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'pending', 'paid', 'refunded'],
        default: 'unpaid',
        index: true
    },
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },
    notes: {
        type: String
    }
}, { timestamps: true });

// Backward & convenience aliases
BookingSchema.virtual("customer").get(function() {
    return this.customerId;
});
BookingSchema.virtual("worker").get(function() {
    return this.workerId;
});

module.exports = mongoose.model("Booking", BookingSchema);
