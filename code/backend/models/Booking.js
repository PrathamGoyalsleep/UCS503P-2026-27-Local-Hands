const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker',
        required: true
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
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'completed', 'paid'],
        default: 'pending'
    },
    notes: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model("Booking", BookingSchema);
