const mongoose = require("mongoose");
const Review = require("../models/Review");
const Booking = require("../models/Booking");
const Worker = require("../models/Worker");

/**
 * Helper to recalculate worker average rating and total review counts
 */
async function recalculateWorkerRating(workerId) {
    if (!workerId) return;

    const reviews = await Review.find({
        $or: [{ worker: workerId }, { workerId: workerId }]
    });

    const totalReviews = reviews.length;
    let averageRating = 0;

    if (totalReviews > 0) {
        const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
        averageRating = Number((sum / totalReviews).toFixed(1));
    }

    await Worker.findByIdAndUpdate(workerId, {
        rating: averageRating,
        averageRating: averageRating,
        reviewsCount: totalReviews,
        totalReviews: totalReviews
    });

    return { averageRating, totalReviews };
}

/**
 * POST /api/reviews
 * Creates a new customer review for a completed service booking.
 */
const createReview = async (req, res) => {
    try {
        const { bookingId, rating, comment } = req.body;
        const customerId = req.user._id ? req.user._id.toString() : req.user.id;

        // 1. Validation of booking ID
        if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ message: "Valid booking ID is required to submit a review." });
        }

        // 2. Validate rating range (1 to 5)
        const numericRating = Number(rating);
        if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
            return res.status(400).json({ message: "Rating must be a number between 1 and 5." });
        }

        // 3. Find booking & verify ownership
        const booking = await Booking.findById(bookingId).populate("workerId");
        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        const bookingCustomerId = (booking.customerId?._id || booking.customerId).toString();
        if (bookingCustomerId !== customerId) {
            return res.status(403).json({ message: "You can only review bookings made from your account." });
        }

        // 4. Booking must be completed or paid
        const isEligible = booking.status === "completed" || booking.status === "paid" || booking.paymentStatus === "paid";
        if (!isEligible) {
            return res.status(400).json({ 
                message: `Reviews are only permitted for completed service bookings. Current booking status is '${booking.status}'.` 
            });
        }

        // 5. One review per eligible booking (prevent duplicate reviews)
        const existingReview = await Review.findOne({
            $or: [{ booking: booking._id }, { bookingId: booking._id }]
        });

        if (existingReview) {
            return res.status(400).json({ message: "You have already reviewed this booking." });
        }

        const workerId = booking.workerId?._id || booking.workerId;

        // 6. Create review
        const review = await Review.create({
            booking: booking._id,
            bookingId: booking._id,
            customer: customerId,
            customerId: customerId,
            worker: workerId,
            workerId: workerId,
            rating: numericRating,
            comment: (comment || "").trim()
        });

        // 7. Update worker rating statistics
        await recalculateWorkerRating(workerId);

        const populatedReview = await Review.findById(review._id)
            .populate("customer", "name email")
            .populate("customerId", "name email");

        res.status(201).json({
            message: "Review submitted successfully",
            review: populatedReview
        });
    } catch (error) {
        console.error("[Review] createReview error:", error);
        res.status(500).json({ message: error.message || "Failed to submit review." });
    }
};

/**
 * GET /api/reviews/worker/:workerId
 * Returns all reviews for a worker, sorted by newest first.
 */
const getWorkerReviews = async (req, res) => {
    try {
        const { workerId } = req.params;

        if (!workerId || !mongoose.Types.ObjectId.isValid(workerId)) {
            return res.status(400).json({ message: "Invalid worker ID." });
        }

        const reviews = await Review.find({
            $or: [{ worker: workerId }, { workerId: workerId }]
        })
            .populate("customer", "name")
            .populate("customerId", "name")
            .sort({ createdAt: -1 });

        const formatted = reviews.map(r => ({
            _id: r._id,
            bookingId: r.booking || r.bookingId,
            rating: r.rating,
            comment: r.comment,
            customerName: r.customer?.name || r.customerId?.name || "Customer",
            date: new Date(r.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }),
            createdAt: r.createdAt
        }));

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * PUT /api/reviews/:reviewId
 * Update an existing review (Author only).
 */
const updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user._id ? req.user._id.toString() : req.user.id;

        if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).json({ message: "Invalid review ID." });
        }

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: "Review not found." });
        }

        const reviewAuthorId = (review.customer?._id || review.customer || review.customerId).toString();
        if (reviewAuthorId !== userId && req.user.role !== "admin") {
            return res.status(403).json({ message: "You are not authorized to modify this review." });
        }

        if (rating !== undefined) {
            const numericRating = Number(rating);
            if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
                return res.status(400).json({ message: "Rating must be between 1 and 5." });
            }
            review.rating = numericRating;
        }

        if (comment !== undefined) {
            review.comment = comment.trim();
        }

        await review.save();

        // Recalculate worker stats
        const workerId = review.worker || review.workerId;
        await recalculateWorkerRating(workerId);

        const updated = await Review.findById(review._id)
            .populate("customer", "name")
            .populate("customerId", "name");

        res.json({
            message: "Review updated successfully",
            review: updated
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * DELETE /api/reviews/:reviewId
 * Deletes a review (Author or Admin).
 */
const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user._id ? req.user._id.toString() : req.user.id;
        const userRole = req.user.role;

        if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).json({ message: "Invalid review ID." });
        }

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ message: "Review not found." });
        }

        const reviewAuthorId = (review.customer?._id || review.customer || review.customerId).toString();
        if (reviewAuthorId !== userId && userRole !== "admin") {
            return res.status(403).json({ message: "Not authorized to delete this review." });
        }

        const workerId = review.worker || review.workerId;
        await Review.findByIdAndDelete(review._id);

        // Recalculate worker stats
        await recalculateWorkerRating(workerId);

        res.json({ message: "Review deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createReview,
    getWorkerReviews,
    updateReview,
    deleteReview
};

