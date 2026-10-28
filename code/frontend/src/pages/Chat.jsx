import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { getMyBookings } from "../services/bookingService";
import { getConversation, fetchMessages, postMessage } from "../services/chatService";
import {
    ArrowLeft,
    CalendarDays,
    Clock3,
    Wrench,
    MessageSquare,
    AlertTriangle,
    Send as SendIcon,
    RefreshCw
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso) {
    if (!iso) return "Today";
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

function groupByDate(messages) {
    const groups = [];
    let currentDate = null;

    messages.forEach((msg) => {
        const date = formatDate(msg.createdAt);
        if (date !== currentDate) {
            groups.push({ type: "date", label: date });
            currentDate = date;
        }
        groups.push({ type: "msg", data: msg });
    });
    return groups;
}

function Avatar({ name, size = 36 }) {
    const initials = name
        ? name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
        : "?";
    const colors = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EC4899", "#06B6D4"];
    const color = colors[name?.charCodeAt(0) % colors.length] || "#6B7280";

    return (
        <div
            aria-hidden="true"
            style={{
                width: size, height: size, borderRadius: "50%",
                background: color, color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: size * 0.38, flexShrink: 0,
                userSelect: "none", letterSpacing: "0.5px"
            }}
        >
            {initials}
        </div>
    );
}

function StatusDot({ status }) {
    const cfg = {
        pending:   { color: "#F59E0B", label: "Pending" },
        accepted:  { color: "#10B981", label: "Accepted" },
        rejected:  { color: "#EF4444", label: "Declined" },
        completed: { color: "#6366F1", label: "Completed" },
        paid:      { color: "#8B5CF6", label: "Paid" },
    };
    const c = cfg[status] || cfg.pending;
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: "0.3rem",
            background: c.color + "18", color: c.color,
            border: `1px solid ${c.color}40`,
            padding: "0.2rem 0.6rem", borderRadius: "20px",
            fontSize: "0.75rem", fontWeight: 600
        }}>
            <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: c.color, display: "inline-block"
            }} />
            {c.label}
        </span>
    );
}

// ─── Main Chat Page ────────────────────────────────────────────────────────────

export default function Chat() {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const { token, user } = useAuth();

    const [booking, setBooking] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [typingUser, setTypingUser] = useState(null);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);

    const socketRef = useRef(null);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const typingTimerRef = useRef(null);
    const isTypingRef = useRef(false);

    // Scroll to bottom whenever messages update
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, typingUser]);

    // Load booking info & conversation history
    const loadChat = useCallback(async () => {
        if (!token || !bookingId) return;
        setLoading(true);
        setError(null);

        try {
            // 1. Direct fetch from conversation endpoint
            let bundleLoaded = false;
            try {
                const data = await getConversation(bookingId, token);
                if (data?.booking) {
                    setBooking(data.booking);
                    setMessages(Array.isArray(data.messages) ? data.messages : []);
                    bundleLoaded = true;
                }
            } catch (directErr) {
                console.warn("[Chat] Direct conversation bundle note:", directErr.message);
                if (directErr.message?.includes("not authorized") || directErr.message?.includes("declined")) {
                    throw directErr;
                }
            }

            // 2. Resilient fallback using getMyBookings + fetchMessages
            if (!bundleLoaded) {
                const list = await getMyBookings(token);
                const found = Array.isArray(list) ? list.find((b) => b._id === bookingId) : null;
                if (!found) {
                    setError("Booking not found or you are not authorized to view this chat.");
                    return;
                }
                setBooking(found);

                const hist = await fetchMessages(bookingId, token);
                setMessages(Array.isArray(hist) ? hist : []);
            }
        } catch (err) {
            console.error("[Chat] Failed to load chat:", err);
            setError(err.message || "Failed to load chat messages.");
        } finally {
            setLoading(false);
        }
    }, [bookingId, token]);

    useEffect(() => {
        loadChat();
    }, [loadChat]);

    // Setup Socket.IO connection
    useEffect(() => {
        if (!bookingId || !token) return;

        const socket = io(API_URL, {
            auth: { token },
            transports: ["websocket", "polling"],
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            setConnected(true);
            socket.emit("join_room", bookingId);
        });

        socket.on("disconnect", () => {
            setConnected(false);
        });

        socket.on("receive_message", (msg) => {
            if (!msg || !msg._id) return;
            setMessages((prev) => {
                if (prev.some((m) => m._id === msg._id)) return prev;
                return [...prev, msg];
            });
        });

        socket.on("user_typing", ({ name, userName }) => {
            setTypingUser(name || userName);
        });

        socket.on("user_stop_typing", () => {
            setTypingUser(null);
        });

        socket.on("user_stopped_typing", () => {
            setTypingUser(null);
        });

        socket.on("chat_error", (err) => {
            console.warn("[Chat] Socket error:", err?.message);
        });

        return () => {
            socket.emit("leave_room", bookingId);
            socket.disconnect();
        };
    }, [bookingId, token]);

    // ── Send message (Socket with REST fallback) ───────────────────────────────
    const sendMessage = useCallback(async () => {
        const text = input.trim();
        if (!text || sending) return;

        setSending(true);
        setInput("");

        if (isTypingRef.current) {
            isTypingRef.current = false;
            socketRef.current?.emit("typing_stop", bookingId);
        }

        if (connected && socketRef.current) {
            socketRef.current.emit("send_message", {
                bookingId,
                token,
                text,
            });
            setSending(false);
            setTimeout(() => inputRef.current?.focus(), 50);
        } else {
            // REST fallback
            try {
                const newMsg = await postMessage(bookingId, text, token);
                setMessages((prev) => {
                    if (prev.some((m) => m._id === newMsg._id)) return prev;
                    return [...prev, newMsg];
                });
            } catch (err) {
                console.error("[Chat] REST send error:", err);
                alert("Failed to send message: " + (err.message || "Connection issue"));
            } finally {
                setSending(false);
                setTimeout(() => inputRef.current?.focus(), 50);
            }
        }
    }, [input, sending, bookingId, token, connected]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // ── Typing indicator ───────────────────────────────────────────────────────
    const handleInputChange = (e) => {
        setInput(e.target.value);

        if (!isTypingRef.current) {
            isTypingRef.current = true;
            socketRef.current?.emit("typing_start", bookingId);
        }

        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
            isTypingRef.current = false;
            socketRef.current?.emit("typing_stop", bookingId);
        }, 1500);
    };

    // ── Peer information ───────────────────────────────────────────────────────
    const isWorker = user?.role === "worker";
    const peer = booking
        ? (isWorker
            ? {
                name: booking.customer?.name || booking.customerId?.name || "Customer",
                label: "Customer"
              }
            : {
                name: booking.worker?.name || booking.workerId?.userId?.name || "Service Professional",
                label: booking.worker?.category || booking.workerId?.category || "Professional"
              })
        : { name: "Loading…", label: "" };

    const serviceCategory = booking?.worker?.category || booking?.workerId?.category || booking?.service || "Home Service";
    const bookingDate = booking?.date || "";
    const bookingTime = booking?.time || "";

    const grouped = groupByDate(messages);

    // ── Loading state ──────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div style={styles.centeredPage}>
                <div style={styles.spinner} />
                <p style={{ color: "#64748B", marginTop: "1rem", fontWeight: 500 }}>
                    Opening secure chat room…
                </p>
            </div>
        );
    }

    // ── Error state with Retry ─────────────────────────────────────────────────
    if (error) {
        return (
            <div style={styles.centeredPage}>
                <div style={{ marginBottom: "0.75rem", display: "flex", justifyContent: "center" }}>
                    <AlertTriangle size={44} color="#EF4444" />
                </div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1E293B", marginBottom: "0.5rem" }}>
                    Unable to Open Chat
                </h2>
                <p style={{ color: "#64748B", fontSize: "0.95rem", maxWidth: "420px", marginBottom: "1.5rem" }}>
                    {error}
                </p>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
                    <button
                        style={{
                            ...styles.backBtn,
                            marginTop: 0,
                            background: "var(--primary, #2563EB)",
                            color: "white",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.45rem",
                            boxShadow: "0 2px 8px rgba(37,99,235,0.25)"
                        }}
                        onClick={loadChat}
                    >
                        <RefreshCw size={15} />
                        Retry Connection
                    </button>
                    <button
                        style={{
                            ...styles.backBtn,
                            marginTop: 0,
                            background: "#F1F5F9",
                            color: "#334155",
                            border: "1px solid #CBD5E1"
                        }}
                        onClick={() => navigate("/bookings")}
                    >
                        &larr; Back to Bookings
                    </button>
                </div>
            </div>
        );
    }

    // ── Render Chat UI ─────────────────────────────────────────────────────────
    return (
        <div style={styles.page}>
            <div style={styles.chatContainer}>

                {/* ── Top Header ─────────────────────────────────────── */}
                <div style={styles.header}>
                    <button
                        onClick={() => navigate("/bookings")}
                        style={styles.backIconBtn}
                        aria-label="Back to bookings"
                        title="Back to bookings list"
                    >
                        <ArrowLeft size={18} />
                    </button>

                    <Avatar name={peer.name} size={42} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={styles.headerName}>{peer.name}</div>
                        <div style={styles.headerSub}>
                            <span>{peer.label}</span>
                            {booking && (
                                <span style={{ marginLeft: "0.5rem" }}>
                                    &middot; <StatusDot status={booking.status} />
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Connection badge */}
                    <div style={{
                        ...styles.connBadge,
                        background: connected ? "#D1FAE5" : "#FEE2E2",
                        color: connected ? "#065F46" : "#991B1B",
                    }}>
                        <span style={{
                            width: 7, height: 7, borderRadius: "50%",
                            background: connected ? "#10B981" : "#EF4444",
                            display: "inline-block"
                        }} />
                        {connected ? "Live" : "Offline"}
                    </div>
                </div>

                {/* ── Booking Context Strip ───────────────────────────── */}
                {booking && (
                    <div style={styles.contextStrip}>
                        {bookingDate && (
                            <span style={{ ...styles.contextItem, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                <CalendarDays size={13} />
                                <span>{bookingDate}</span>
                            </span>
                        )}
                        {bookingTime && (
                            <>
                                <span style={styles.contextSep} />
                                <span style={{ ...styles.contextItem, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                    <Clock3 size={13} />
                                    <span>{bookingTime}</span>
                                </span>
                            </>
                        )}
                        {serviceCategory && (
                            <>
                                <span style={styles.contextSep} />
                                <span style={{ ...styles.contextItem, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                    <Wrench size={13} />
                                    <span>{serviceCategory}</span>
                                </span>
                            </>
                        )}
                    </div>
                )}

                {/* ── Messages Area ───────────────────────────────────── */}
                <div style={styles.messagesArea}>
                    {grouped.length === 0 && (
                        <div style={styles.emptyChat}>
                            <div style={{ marginBottom: "0.75rem", display: "flex", justifyContent: "center" }}>
                                <MessageSquare size={44} color="#94A3B8" />
                            </div>
                            <p style={{ fontWeight: 700, color: "#1E293B", fontSize: "1.05rem", marginBottom: "0.3rem" }}>
                                {isWorker
                                    ? "Start conversation with client"
                                    : "Start a conversation with your professional"}
                            </p>
                            <p style={{ color: "#64748B", fontSize: "0.9rem", maxWidth: "380px", margin: "0 auto", lineHeight: 1.5 }}>
                                Send a message below to coordinate arrival time, share specific instructions, or ask questions before the visit.
                            </p>
                        </div>
                    )}

                    {grouped.map((item, i) => {
                        if (item.type === "date") {
                            return (
                                <div key={`date-${i}`} style={styles.dateDivider}>
                                    <span style={styles.dateDividerText}>{item.label}</span>
                                </div>
                            );
                        }

                        const msg = item.data;
                        const isMine =
                            msg.senderId === user?._id ||
                            msg.senderId === user?.id ||
                            (typeof msg.senderId === "object" && (msg.senderId?._id === user?._id || msg.senderId?._id === user?.id));

                        return (
                            <div
                                key={msg._id || i}
                                style={{
                                    ...styles.messageRow,
                                    justifyContent: isMine ? "flex-end" : "flex-start",
                                }}
                            >
                                {!isMine && (
                                    <Avatar name={msg.senderName} size={32} />
                                )}

                                <div style={{ maxWidth: "70%", display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start", gap: "0.2rem" }}>
                                    {!isMine && (
                                        <span style={styles.senderLabel}>{msg.senderName}</span>
                                    )}
                                    <div style={{
                                        ...styles.bubble,
                                        background: isMine ? "var(--primary, #2563EB)" : "white",
                                        color: isMine ? "white" : "#1F2937",
                                        borderBottomRightRadius: isMine ? "4px" : "18px",
                                        borderBottomLeftRadius: isMine ? "18px" : "4px",
                                        boxShadow: isMine
                                            ? "0 2px 10px rgba(37,99,235,0.22)"
                                            : "0 1px 4px rgba(0,0,0,0.06)",
                                    }}>
                                        {msg.text}
                                        <span style={{
                                            ...styles.timestamp,
                                            color: isMine ? "rgba(255,255,255,0.7)" : "#94A3B8"
                                        }}>
                                            {formatTime(msg.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                {isMine && (
                                    <Avatar name={user?.name} size={32} />
                                )}
                            </div>
                        );
                    })}

                    {/* Typing indicator */}
                    {typingUser && (
                        <div style={{ ...styles.messageRow, justifyContent: "flex-start" }}>
                            <Avatar name={typingUser} size={32} />
                            <div style={{ ...styles.bubble, background: "white", color: "#64748B", padding: "0.6rem 1rem", border: "1px solid #E2E8F0" }}>
                                <span style={styles.typingDots}>
                                    <span /><span /><span />
                                </span>
                                <span style={{ fontSize: "0.8rem", marginLeft: "0.5rem", fontWeight: 500 }}>
                                    {typingUser} is typing…
                                </span>
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>

                {/* ── Input Bar ───────────────────────────────────────── */}
                <div style={styles.inputBar}>
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder={connected ? "Type your message…" : "Connecting to chat…"}
                        rows={1}
                        disabled={sending}
                        aria-label="Message input"
                        style={styles.textarea}
                    />

                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || sending}
                        aria-label="Send message"
                        style={{
                            ...styles.sendBtn,
                            opacity: input.trim() && !sending ? 1 : 0.45,
                            cursor: input.trim() && !sending ? "pointer" : "not-allowed",
                        }}
                    >
                        <SendIcon size={18} />
                    </button>
                </div>

                {!connected && (
                    <div style={styles.offlineBanner}>
                        Connecting to live chat server… Messages will be delivered via instant sync.
                    </div>
                )}

            </div>
        </div>
    );
}

// ─── Inline Styles ────────────────────────────────────────────────────────────

const styles = {
    page: {
        minHeight: "calc(100vh - 64px)",
        background: "#F1F5F9",
        display: "flex",
        justifyContent: "center",
        alignItems: "stretch",
        padding: "1rem",
        boxSizing: "border-box",
    },
    centeredPage: {
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
    },
    chatContainer: {
        width: "100%",
        maxWidth: "760px",
        background: "#F8FAFC",
        borderRadius: "20px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: "1px solid #E2E8F0",
        height: "calc(100vh - 100px)",
    },
    header: {
        display: "flex",
        alignItems: "center",
        gap: "0.85rem",
        padding: "0.9rem 1.25rem",
        background: "white",
        borderBottom: "1px solid #E2E8F0",
        flexShrink: 0,
    },
    backIconBtn: {
        background: "none",
        border: "none",
        color: "#64748B",
        cursor: "pointer",
        padding: "0.35rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "8px",
        transition: "background 0.15s, color 0.15s",
    },
    headerName: {
        fontWeight: 700,
        fontSize: "1.05rem",
        color: "#0F172A",
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    headerSub: {
        fontSize: "0.8rem",
        color: "#64748B",
        marginTop: "0.15rem",
        display: "flex",
        alignItems: "center",
    },
    connBadge: {
        fontSize: "0.75rem",
        fontWeight: 600,
        padding: "0.25rem 0.65rem",
        borderRadius: "20px",
        display: "flex",
        alignItems: "center",
        gap: "0.35rem",
        flexShrink: 0,
    },
    contextStrip: {
        background: "#EFF6FF",
        borderBottom: "1px solid #DBEAFE",
        padding: "0.5rem 1.25rem",
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0.6rem",
        fontSize: "0.78rem",
        color: "#1E40AF",
        fontWeight: 500,
        flexShrink: 0,
    },
    contextItem: {
        color: "#1E40AF",
    },
    contextSep: {
        width: 3,
        height: 3,
        borderRadius: "50%",
        background: "#93C5FD",
        display: "inline-block",
    },
    messagesArea: {
        flex: 1,
        overflowY: "auto",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
    },
    emptyChat: {
        margin: "auto",
        textAlign: "center",
        padding: "2rem 1rem",
    },
    dateDivider: {
        display: "flex",
        justifyContent: "center",
        margin: "0.5rem 0",
    },
    dateDividerText: {
        background: "#E2E8F0",
        color: "#64748B",
        fontSize: "0.72rem",
        fontWeight: 600,
        padding: "0.2rem 0.75rem",
        borderRadius: "20px",
    },
    messageRow: {
        display: "flex",
        alignItems: "flex-end",
        gap: "0.5rem",
    },
    senderLabel: {
        fontSize: "0.72rem",
        color: "#64748B",
        fontWeight: 600,
        paddingLeft: "0.25rem",
    },
    bubble: {
        padding: "0.65rem 1rem",
        borderRadius: "18px",
        fontSize: "0.92rem",
        lineHeight: 1.45,
        wordBreak: "break-word",
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
    },
    timestamp: {
        fontSize: "0.68rem",
        alignSelf: "flex-end",
        fontWeight: 500,
    },
    typingDots: {
        display: "inline-flex",
        gap: "3px",
        alignItems: "center",
    },
    inputBar: {
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        padding: "0.85rem 1.25rem",
        background: "white",
        borderTop: "1px solid #E2E8F0",
        flexShrink: 0,
    },
    textarea: {
        flex: 1,
        border: "1.5px solid #CBD5E1",
        borderRadius: "24px",
        padding: "0.65rem 1.1rem",
        fontSize: "0.92rem",
        outline: "none",
        resize: "none",
        fontFamily: "inherit",
        lineHeight: 1.4,
        background: "#F8FAFC",
        color: "#0F172A",
        transition: "border-color 0.15s",
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: "var(--primary, #2563EB)",
        color: "white",
        border: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "opacity 0.15s, transform 0.1s",
    },
    offlineBanner: {
        background: "#FFFBEB",
        color: "#92400E",
        fontSize: "0.78rem",
        textAlign: "center",
        padding: "0.35rem",
        borderTop: "1px solid #FDE68A",
        fontWeight: 500,
    },
    spinner: {
        width: 36,
        height: 36,
        border: "3px solid #E2E8F0",
        borderTopColor: "var(--primary, #2563EB)",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
    },
    backBtn: {
        marginTop: "1.25rem",
        background: "var(--primary, #2563EB)",
        color: "white",
        border: "none",
        borderRadius: "10px",
        padding: "0.6rem 1.25rem",
        fontWeight: 600,
        cursor: "pointer",
        transition: "background 0.15s",
    },
};
