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
  Send,
  RefreshCw,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
    ? name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#E8EEEB",
        color: "#2563EB",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.38,
        flexShrink: 0,
        userSelect: "none",
        letterSpacing: "0.5px",
      }}
    >
      {initials}
    </div>
  );
}

export default function Chat() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [booking, setBooking] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
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

  // Load conversation list for left sidebar
  useEffect(() => {
    async function loadConversationsList() {
      if (!token) return;
      try {
        const list = await getMyBookings(token);
        if (Array.isArray(list)) {
          // Show non-rejected bookings or all bookings
          setConversations(list);
        }
      } catch (err) {
        console.warn("[Chat] Failed to load conversations list:", err.message);
      } finally {
        setLoadingConversations(false);
      }
    }
    loadConversationsList();
  }, [token]);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  // Load active booking info & conversation history
  const loadChat = useCallback(async () => {
    if (!token || !bookingId) return;
    setLoading(true);
    setError(null);

    try {
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

  // Socket.IO connection
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

  // Send message
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

  const isWorker = user?.role === "worker";
  const peer = booking
    ? isWorker
      ? {
          name: booking.customer?.name || booking.customerId?.name || "Customer",
          label: "Customer",
        }
      : {
          name: booking.worker?.name || booking.workerId?.userId?.name || "Service Professional",
          label: booking.worker?.category || booking.workerId?.category || "Professional",
        }
    : { name: "Loading…", label: "" };

  const bookingRef = `#SC-${booking?._id ? booking._id.slice(-6).toUpperCase() : "REQ"}`;
  const grouped = groupByDate(messages);

  return (
    <div
      className="chat-page"
      style={{
        display: "flex",
        height: "calc(100vh - 68px)",
        background: "#F3F5F4",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        color: "#0F172A",
        overflow: "hidden",
      }}
    >
      {/* ── Conversation Sidebar (Left, 280px): NO card per conversation ── */}
      <aside
        style={{
          width: "280px",
          minWidth: "280px",
          background: "#FFFFFF",
          borderRight: "1px solid #E8EFEC",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        {/* Sidebar Header */}
        <div
          style={{
            padding: "1rem 1.25rem",
            borderBottom: "1px solid #E8EFEC",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "#0F172A", margin: 0 }}>
              Conversations
            </h2>
            <div style={{ fontSize: "0.75rem", color: "#94A1A0", marginTop: "0.15rem" }}>
              Active Service Chats
            </div>
          </div>
          <button
            onClick={() => navigate("/bookings")}
            style={{
              background: "transparent",
              border: "none",
              color: "#657477",
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            &larr; Bookings
          </button>
        </div>

        {/* Conversation List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loadingConversations ? (
            <div style={{ padding: "1.5rem", color: "#94A1A0", fontSize: "0.85rem", textAlign: "center" }}>
              Loading chats...
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: "2rem 1.25rem", color: "#94A1A0", fontSize: "0.85rem", textAlign: "center" }}>
              No active conversations yet.
            </div>
          ) : (
            conversations.map((c) => {
              const isActive = c._id === bookingId;
              const cPartner = isWorker
                ? c.customerId?.name || "Client"
                : c.workerId?.userId?.name || "Specialist";
              const cRef = `#SC-${c._id ? c._id.slice(-6).toUpperCase() : ""}`;

              return (
                <div
                  key={c._id}
                  onClick={() => navigate(`/chat/${c._id}`)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.85rem 1rem",
                    borderBottom: "1px solid #E8EFEC",
                    background: isActive ? "#E8EEEB" : "transparent",
                    borderLeft: isActive ? "2px solid #2563EB" : "2px solid transparent",
                    cursor: "pointer",
                    transition: "background 0.15s ease",
                  }}
                >
                  <Avatar name={cPartner} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span
                        style={{
                          fontSize: "0.86rem",
                          fontWeight: isActive ? 700 : 600,
                          color: "#0F172A",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {cPartner}
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "#94A1A0", flexShrink: 0 }}>
                        {c.date || ""}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "0.15rem",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#657477",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "140px",
                        }}
                      >
                        {c.service || cRef}
                      </span>
                      <span style={{ fontSize: "0.68rem", color: "#94A1A0", fontWeight: 600 }}>
                        {cRef}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* ── Message Area (Right): Background #F3F5F4 ── */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          background: "#F3F5F4",
        }}
      >
        {/* Top Bar: Simple Header, border-bottom #E8EFEC */}
        <div
          style={{
            padding: "0.75rem 1.5rem",
            background: "#FFFFFF",
            borderBottom: "1px solid #E8EFEC",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <Avatar name={peer.name} size={38} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0F172A" }}>
                  {peer.name}
                </span>
                <span style={{ fontSize: "0.72rem", color: "#94A1A0", fontWeight: 600 }}>
                  {bookingRef}
                </span>
              </div>
              <div style={{ fontSize: "0.78rem", color: "#657477" }}>
                {peer.label} &bull; {booking?.service || "Home Service"} &bull; {booking?.date || ""}
              </div>
            </div>
          </div>

          {/* Connection status indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", fontWeight: 600 }}>
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: connected ? "#27805E" : "#A77732",
              }}
            />
            <span style={{ color: connected ? "#27805E" : "#A77732" }}>
              {connected ? "Live" : "Offline"}
            </span>
          </div>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#657477",
              fontSize: "0.9rem",
            }}
          >
            Opening conversation thread...
          </div>
        ) : error ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "2rem",
              textAlign: "center",
            }}
          >
            <AlertTriangle size={36} color="#B34F52" style={{ marginBottom: "0.75rem" }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0F172A", marginBottom: "0.35rem" }}>
              Unable to open chat
            </h3>
            <p style={{ color: "#657477", fontSize: "0.88rem", maxWidth: "400px", marginBottom: "1.25rem" }}>
              {error}
            </p>
            <button
              onClick={loadChat}
              style={{
                background: "#2563EB",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "6px",
                padding: "0.5rem 1rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        ) : (
          /* Message List Area */
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            {grouped.length === 0 && (
              <div
                style={{
                  margin: "auto",
                  textAlign: "center",
                  padding: "2rem",
                  color: "#94A1A0",
                }}
              >
                <MessageSquare size={36} color="#94A1A0" style={{ margin: "0 auto 0.5rem" }} />
                <p style={{ fontWeight: 700, color: "#0F172A", fontSize: "0.95rem", marginBottom: "0.25rem" }}>
                  Start of conversation
                </p>
                <p style={{ fontSize: "0.85rem", maxWidth: "340px", margin: "0 auto" }}>
                  Send a message to coordinate service specifics, location directions, or arrival timing.
                </p>
              </div>
            )}

            {grouped.map((item, idx) => {
              if (item.type === "date") {
                return (
                  <div key={`date-${idx}`} style={{ display: "flex", justifyContent: "center", margin: "0.5rem 0" }}>
                    <span
                      style={{
                        background: "#E8EEEB",
                        color: "#657477",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        padding: "0.15rem 0.65rem",
                        borderRadius: "100px",
                      }}
                    >
                      {item.label}
                    </span>
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
                  key={msg._id || idx}
                  style={{
                    display: "flex",
                    justifyContent: isMine ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "60%",
                      padding: "0.65rem 1rem",
                      fontSize: "0.88rem",
                      lineHeight: 1.45,
                      wordBreak: "break-word",
                      background: isMine ? "#2563EB" : "#FFFFFF",
                      color: isMine ? "#FFFFFF" : "#0F172A",
                      border: isMine ? "none" : "1px solid #E8EFEC",
                      borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      boxShadow: "none",
                    }}
                  >
                    <div>{msg.text}</div>
                    <div
                      style={{
                        fontSize: "0.68rem",
                        marginTop: "0.3rem",
                        textAlign: "right",
                        color: isMine ? "rgba(255, 255, 255, 0.7)" : "#94A1A0",
                      }}
                    >
                      {formatTime(msg.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {typingUser && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    background: "#FFFFFF",
                    color: "#657477",
                    border: "1px solid #E8EFEC",
                    borderRadius: "16px 16px 16px 4px",
                    padding: "0.5rem 0.85rem",
                    fontSize: "0.78rem",
                    fontStyle: "italic",
                  }}
                >
                  {typingUser} is typing...
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}

        {/* ── Input Area: border-top #E8EFEC, bg #FFFFFF ── */}
        <div
          style={{
            borderTop: "1px solid #E8EFEC",
            background: "#FFFFFF",
            padding: "0.85rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            flexShrink: 0,
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={connected ? "Type a message..." : "Connecting to chat..."}
            disabled={sending}
            style={{
              flex: 1,
              background: "#FFFFFF",
              border: "1px solid #D5E0DC",
              borderRadius: "8px",
              padding: "0.65rem 0.9rem",
              fontSize: "0.9rem",
              color: "#0F172A",
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            style={{
              background: "#2563EB",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "8px",
              padding: "0.65rem 1rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: input.trim() && !sending ? "pointer" : "not-allowed",
              opacity: input.trim() && !sending ? 1 : 0.5,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <Send size={14} />
            <span>Send</span>
          </button>
        </div>
      </main>
    </div>
  );
}
