const express = require("express");
const { getConversation, getMessages, postMessage } = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All chat routes require valid JWT authentication
router.use(protect);

// Get complete conversation bundle (booking info, participants, and message history)
router.get("/:bookingId", getConversation);

// Get full message history for a booking room
router.get("/:bookingId/messages", getMessages);

// Post message (REST fallback)
router.post("/:bookingId/messages", postMessage);

module.exports = router;
