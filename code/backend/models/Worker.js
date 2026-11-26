const mongoose = require("mongoose");

const WorkerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    phone: {
        type: String
    },
    category: {
        type: String,
        index: true
    },
    experience: {
        type: Number
    },
    charges: {
        type: Number
    },
    location: {
        type: String,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        index: true
    },
    rating: {
        type: Number,
        default: 0
    },
    averageRating: {
        type: Number,
        default: 0
    },
    reviewsCount: {
        type: Number,
        default: 0
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    photo: {
        type: String
    },
    profileImage: {
        type: String
    },
    profileImagePublicId: {
        type: String
    },
    certifications: {
        type: [String],
        default: []
    },
    certificates: [{
        title: { type: String, required: true },
        url: { type: String, required: true },
        publicId: { type: String },
        docType: { type: String, default: "Certificate" },
        uploadedAt: { type: Date, default: Date.now }
    }],
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
        publicId: { type: String },
        verified: { type: Boolean, default: false },
        uploadedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

// Pre-save hook to ensure status & verificationStatus, rating & averageRating, photo & profileImage are in sync
WorkerSchema.pre("save", function() {
    if (this.status && !this.verificationStatus) {
        this.verificationStatus = this.status;
    } else if (this.verificationStatus && !this.status) {
        this.status = this.verificationStatus;
    } else if (this.isModified("status")) {
        this.verificationStatus = this.status;
    } else if (this.isModified("verificationStatus")) {
        this.status = this.verificationStatus;
    }

    if (this.rating !== undefined && this.averageRating === undefined) {
        this.averageRating = this.rating;
    } else if (this.isModified("rating")) {
        this.averageRating = this.rating;
    } else if (this.isModified("averageRating")) {
        this.rating = this.averageRating;
    }

    if (this.reviewsCount !== undefined && this.totalReviews === undefined) {
        this.totalReviews = this.reviewsCount;
    } else if (this.isModified("reviewsCount")) {
        this.totalReviews = this.reviewsCount;
    } else if (this.isModified("totalReviews")) {
        this.reviewsCount = this.totalReviews;
    }

    if (this.photo && !this.profileImage) {
        this.profileImage = this.photo;
    } else if (this.profileImage && !this.photo) {
        this.photo = this.profileImage;
    }
});

module.exports = mongoose.model("Worker", WorkerSchema);
