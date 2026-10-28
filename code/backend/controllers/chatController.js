const mongoose = require("mongoose");
const Message = require("../models/Message");
const Booking = require("../models/Booking");
const Conversation = require("../models/Conversation");

/**
 * Validate booking ID helper
 */
function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Check if the authenticated user is an authorized participant in the booking
 */
function isAuthorizedParticipant(booking, userId, userRole) {
    if (!booking) return false;
    if (userRole === "admin") return true;

    const customerIdStr = booking.customerId?._id
        ? booking.customerId._id.toString()
        : booking.customerId?.toString();

    // workerId may be populated with Worker doc, which has a userId field
    const workerUserIdStr = booking.workerId?.userId?._id
        ? booking.workerId.userId._id.toString()
        : booking.workerId?.userId
            ? booking.workerId.userId.toString()
            : null;

    return customerIdStr === userId || workerUserIdStr === userId;
}

/**
 * GET /api/chat/:bookingId
 * Returns complete conversation bundle: booking metadata, participant details, and message history.
 * Initializes the Conversation record atomically if it does not yet exist.
 */
async function getConversation(req, res) {
    try {
        const { bookingId } = req.params;
        const userId = req.user._id ? req.user._id.toString() : req.user.id;
        const userRole = req.user.role;

        if (!isValidObjectId(bookingId)) {
            return res.status(400).json({ message: "Invalid booking ID format" });
        }

        // Fetch booking with customer and worker information populated
        const booking = await Booking.findById(bookingId)
            .populate("customerId", "name email phone")
            .populate({
                path: "workerId",
                populate: { path: "userId", select: "name email phone" }
            });

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Check if chat is allowed for this booking status
        if (booking.status === "rejected") {
            return res.status(403).json({ message: "Chat is unavailable for declined bookings." });
        }

        // Authorization check
        if (!isAuthorizedParticipant(booking, userId, userRole)) {
            return res.status(403).json({ message: "You are not authorized to access this conversation" });
        }

        // Safely ensure a Conversation record exists (atomic upsert prevents duplicate conversation records)
        let conversation = null;
        try {
            const workerDocId = booking.workerId?._id || booking.workerId;
            const customerDocId = booking.customerId?._id || booking.customerId;

            conversation = await Conversation.findOneAndUpdate(
                { bookingId: booking._id },
                {
                    $setOnInsert: {
                        bookingId: booking._id,
                        customerId: customerDocId,
                        workerId: workerDocId
                    }
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        } catch (convErr) {
            console.warn("[Chat] Conversation upsert warning:", convErr.message);
        }

        // Fetch message history
        const messages = await Message.find({ bookingId: booking._id })
            .sort({ createdAt: 1 })
            .limit(200);

        // Build clean client payload
        const workerUser = booking.workerId?.userId || {};
        const customerUser = booking.customerId || {};

        res.json({
            booking: {
                _id: booking._id,
                status: booking.status,
                service: booking.service || "General Service",
                date: booking.date,
                time: booking.time,
                address: booking.address,
                estimatedPrice: booking.estimatedPrice,
                estimatedHours: booking.estimatedHours,
                customer: {
                    _id: customerUser._id,
                    name: customerUser.name || "Customer",
                    email: customerUser.email,
                    phone: customerUser.phone
                },
                worker: {
                    _id: booking.workerId?._id,
                    name: workerUser.name || "Service Professional",
                    email: workerUser.email,
                    phone: workerUser.phone || booking.workerId?.phone,
                    category: booking.workerId?.category || "Professional"
                }
            },
            conversationId: conversation?._id || booking._id,
            messages: messages || []
        });
    } catch (err) {
        console.error("getConversation error:", err);
        res.status(500).json({ message: "Failed to load conversation. Server error." });
    }
}

/**
 * GET /api/chat/:bookingId/messages
 * Return full message history for a booking room.
 */
async function getMessages(req, res) {
    try {
        const { bookingId } = req.params;
        const userId = req.user._id ? req.user._id.toString() : req.user.id;
        const userRole = req.user.role;

        if (!isValidObjectId(bookingId)) {
            return res.status(400).json({ message: "Invalid booking ID format" });
        }

        const booking = await Booking.findById(bookingId).populate("workerId");
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (!isAuthorizedParticipant(booking, userId, userRole)) {
            return res.status(403).json({ message: "Not authorized to view this chat" });
        }

        const messages = await Message.find({ bookingId })
            .sort({ createdAt: 1 })
            .limit(200);

        res.json(messages || []);
    } catch (err) {
        console.error("getMessages error:", err);
        res.status(500).json({ message: "Failed to load messages" });
    }
}

/**
 * POST /api/chat/:bookingId/messages
 * Persist a new message (REST fallback).
 */
async function postMessage(req, res) {
    try {
        const { bookingId } = req.params;
        const { text } = req.body;
        const userId = req.user._id ? req.user._id.toString() : req.user.id;
        const userRole = req.user.role;

        if (!isValidObjectId(bookingId)) {
            return res.status(400).json({ message: "Invalid booking ID format" });
        }

        if (!text || !text.trim()) {
            return res.status(400).json({ message: "Message text cannot be empty" });
        }

        const booking = await Booking.findById(bookingId).populate("workerId");
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.status === "rejected") {
            return res.status(403).json({ message: "Cannot send messages for declined bookings." });
        }

        if (!isAuthorizedParticipant(booking, userId, userRole)) {
            return res.status(403).json({ message: "Not authorized to send messages in this chat" });
        }

        const msg = await Message.create({
            bookingId,
            senderId:   req.user._id || req.user.id,
            senderName: req.user.name,
            senderRole: req.user.role,
            text:       text.trim(),
            readBy:     [req.user._id || req.user.id]
        });

        // Update Conversation lastMessage
        try {
            await Conversation.findOneAndUpdate(
                { bookingId },
                {
                    $set: {
                        lastMessage: {
                            text: text.trim(),
                            senderId: req.user._id || req.user.id,
                            senderName: req.user.name,
                            createdAt: msg.createdAt
                        }
                    }
                }
            );
        } catch (convErr) {
            console.warn("[Chat] Conversation lastMessage update warning:", convErr.message);
        }

        res.status(201).json(msg);
    } catch (err) {
        console.error("postMessage error:", err);
        res.status(500).json({ message: "Failed to send message" });
    }
}

module.exports = {
    getConversation,
    getMessages,
    postMessage
};
