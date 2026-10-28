const mongoose = require("mongoose");

const WorkerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    phone: {
        type: String
    },
    category: {
        type: String
    },
    experience: {
        type: Number
    },
    charges: {
        type: Number
    },
    location: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rating: {
        type: Number,
        default: 0
    },
    photo: {
        type: String
    },
    certifications: {
        type: [String],
        default: []
    },
    bio: {
        type: String
    },
    workingHours: {
        type: String,
        default: "8:00 AM - 8:00 PM (Mon - Sun)"
    },
    servicesOffered: {
        type: [String],
        default: []
    },
    skills: {
        type: [String],
        default: []
    },
    portfolio: [{
        title: { type: String, required: true },
        description: { type: String },
        serviceType: { type: String },
        imageUrl: { type: String, required: true },
        completedDate: { type: String }
    }],
    reviewsCount: {
        type: Number,
        default: 0
    },
    reviewedAt: {
        type: Date
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    rejectionReason: {
        type: String,
        default: ""
    },
    documents: [{
        title: { type: String, required: true },
        docType: { type: String, required: true }, // e.g. "Identity Proof (Govt ID)", "Trade Certificate", "Address Verification"
        url: { type: String },
        verified: { type: Boolean, default: false },
        uploadedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model("Worker", WorkerSchema);
