const http    = require("http");
const express = require("express");
const cors    = require("cors");
const { Server } = require("socket.io");
const jwt     = require("jsonwebtoken");
require("dotenv").config();

const connectDB = require("./config/db");
const mongoose = require("mongoose");
const Message   = require("./models/Message");
const Booking   = require("./models/Booking");
const Conversation = require("./models/Conversation");

const app    = express();
const server = http.createServer(app);

// --------------------------------------------------
// Socket.io — real-time chat
// --------------------------------------------------
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});

const User = require("./models/User");

/**
 * Authenticate every socket connection via JWT in the
 * handshake auth object. Fetch full user from DB and attach to socket.
 */
io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication error: no token"));

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "defaultsecret");
        const user = await User.findById(decoded.id).select("name role email");
        if (!user) return next(new Error("Authentication error: user not found"));
        socket.user = { id: user._id.toString(), name: user.name, role: user.role, email: user.email };
        next();
    } catch {
        next(new Error("Authentication error: invalid token"));
    }
});

io.on("connection", (socket) => {
    console.log(`[Chat] User connected: ${socket.user?.name} (${socket.id})`);

    // ── Join an authorized booking room ──────────────────────────────
    socket.on("join_room", async (data) => {
        try {
            const bookingId = typeof data === "object" ? data?.bookingId : data;
            if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
                return socket.emit("chat_error", { message: "Invalid booking ID" });
            }

            const booking = await Booking.findById(bookingId).populate("workerId");
            if (!booking) {
                return socket.emit("chat_error", { message: "Booking not found" });
            }

            const userId = socket.user?.id;
            const isCustomer = booking.customerId?.toString() === userId;
            const isWorker   = booking.workerId?.userId?.toString() === userId;
            const isAdmin    = socket.user?.role === "admin";

            if (!isCustomer && !isWorker && !isAdmin) {
                return socket.emit("chat_error", { message: "Unauthorized for this chat room." });
            }

            const roomKey = bookingId.toString();
            socket.join(roomKey);
            console.log(`[Chat] ${socket.user?.name} (${socket.user?.role}) joined room: ${roomKey}`);
        } catch (err) {
            console.error("[Chat] join_room error:", err.message);
            socket.emit("chat_error", { message: "Failed to join chat room" });
        }
    });

    // ── Leave a booking room ─────────────────────────────
    socket.on("leave_room", (data) => {
        const bookingId = typeof data === "object" ? data?.bookingId : data;
        if (bookingId) {
            socket.leave(bookingId.toString());
        }
    });

    // ── Send message ─────────────────────────────────────
    socket.on("send_message", async (payload) => {
        try {
            const { bookingId, text } = payload || {};
            if (!bookingId || !text?.trim() || !mongoose.Types.ObjectId.isValid(bookingId)) {
                return socket.emit("chat_error", { message: "Invalid message payload" });
            }

            // Verify user belongs to booking
            const booking = await Booking.findById(bookingId).populate("workerId");
            if (!booking) {
                return socket.emit("chat_error", { message: "Booking not found" });
            }

            const userId = socket.user?.id;
            const isCustomer = booking.customerId?.toString() === userId;
            const isWorker   = booking.workerId?.userId?.toString() === userId;
            const isAdmin    = socket.user?.role === "admin";

            if (!isCustomer && !isWorker && !isAdmin) {
                return socket.emit("chat_error", { message: "Unauthorized to send messages for this booking" });
            }

            if (booking.status === "rejected") {
                return socket.emit("chat_error", { message: "Cannot send messages for declined bookings." });
            }

            // Persist to MongoDB
            const msg = await Message.create({
                bookingId,
                senderId:   socket.user.id,
                senderName: socket.user.name,
                senderRole: socket.user.role,
                text:       text.trim(),
                readBy:     [socket.user.id]
            });

            // Update Conversation record lastMessage
            try {
                await Conversation.findOneAndUpdate(
                    { bookingId },
                    {
                        $set: {
                            lastMessage: {
                                text: text.trim(),
                                senderId: socket.user.id,
                                senderName: socket.user.name,
                                createdAt: msg.createdAt
                            }
                        }
                    }
                );
            } catch (convErr) {
                console.warn("[Chat] Conversation lastMessage update warning:", convErr.message);
            }

            // Broadcast to everyone in the room (including sender)
            io.to(bookingId.toString()).emit("receive_message", msg);
        } catch (err) {
            console.error("[Chat] send_message error:", err);
            socket.emit("chat_error", { message: "Failed to send message" });
        }
    });

    // ── Typing indicators ────────────────────────────────
    socket.on("typing_start", (data) => {
        const bookingId = typeof data === "object" ? data?.bookingId : data;
        if (bookingId) {
            socket.to(bookingId.toString()).emit("user_typing", {
                name: socket.user.name,
                userName: socket.user.name
            });
        }
    });

    socket.on("typing_stop", (data) => {
        const bookingId = typeof data === "object" ? data?.bookingId : data;
        if (bookingId) {
            socket.to(bookingId.toString()).emit("user_stopped_typing");
            socket.to(bookingId.toString()).emit("user_stop_typing");
        }
    });

    socket.on("disconnect", () => {
        console.log(`[Chat] User disconnected: ${socket.user?.name}`);
    });
});

// --------------------------------------------------
// REST API
// --------------------------------------------------
connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());

app.get("/", (req, res) => res.send("ServeConnect Backend is running"));

app.use("/api/auth",     require("./routes/authRoutes"));
app.use("/api/workers",  require("./routes/workerRoutes"));
app.use("/api/admin",    require("./routes/adminRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/chat",     require("./routes/chatRoutes"));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
