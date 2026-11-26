const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
        unique: true,
        index: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    worker: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker',
        required: true,
        index: true
    },
    // Keep legacy field names in sync for full backward compatibility
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        index: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Worker',
        index: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        default: ""
    }
}, { timestamps: true });

// Pre-save to sync customer/customerId and worker/workerId and booking/bookingId
ReviewSchema.pre("save", function() {
    if (this.booking && !this.bookingId) this.bookingId = this.booking;
    if (this.bookingId && !this.booking) this.booking = this.bookingId;

    if (this.customer && !this.customerId) this.customerId = this.customer;
    if (this.customerId && !this.customer) this.customer = this.customerId;

    if (this.worker && !this.workerId) this.workerId = this.worker;
    if (this.workerId && !this.worker) this.worker = this.workerId;
});

module.exports = mongoose.model("Review", ReviewSchema);
