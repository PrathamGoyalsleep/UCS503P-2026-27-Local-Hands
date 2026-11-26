const express = require("express");
const router = express.Router();
const {
    createReview,
    getWorkerReviews,
    updateReview,
    deleteReview
} = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");

// Public route to view reviews for a worker
router.get("/worker/:workerId", getWorkerReviews);

// Protected routes (Customer or Admin)
router.post("/", protect, createReview);
router.put("/:reviewId", protect, updateReview);
router.delete("/:reviewId", protect, deleteReview);

module.exports = router;

