const express = require("express");
const { createBooking, getMyBookings, updateBookingStatus } = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All booking routes require authentication
router.use(protect);

router.post("/", createBooking);
router.get("/my-bookings", getMyBookings);
router.put("/:id/status", updateBookingStatus);

module.exports = router;

