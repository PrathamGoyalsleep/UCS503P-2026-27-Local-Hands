const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Normalizes (bookingId, token) or (token, bookingId) parameters
 * to prevent order mistakes across different callers.
 */
function resolveBookingAndToken(arg1, arg2) {
    let bookingId = "";
    let token = "";

    // Standard JWT has two periods separating three Base64URL parts: header.payload.signature
    if (typeof arg1 === "string" && arg1.includes(".")) {
        token = arg1;
        bookingId = arg2;
    } else if (typeof arg2 === "string" && arg2.includes(".")) {
        bookingId = arg1;
        token = arg2;
    } else {
        // Fallback default: first is bookingId, second is token
        bookingId = arg1;
        token = arg2;
    }

    return { bookingId, token };
}

/**
 * GET /api/chat/:bookingId
 * Returns complete conversation bundle (booking metadata, participants, and message history)
 */
export async function getConversation(arg1, arg2) {
    const { bookingId, token } = resolveBookingAndToken(arg1, arg2);
    if (!bookingId) throw new Error("Missing booking ID");

    const res = await fetch(`${API}/api/chat/${bookingId}`, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        }
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.message || `Failed to load conversation (${res.status})`);
    }
    return data;
}

/**
 * GET /api/chat/:bookingId/messages
 * Returns message history array
 */
export async function fetchMessages(arg1, arg2) {
    const { bookingId, token } = resolveBookingAndToken(arg1, arg2);
    if (!bookingId) throw new Error("Missing booking ID");

    const res = await fetch(`${API}/api/chat/${bookingId}/messages`, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        }
    });

    const data = await res.json().catch(() => ([]));
    if (!res.ok) {
        throw new Error(data.message || `Failed to load messages (${res.status})`);
    }
    return Array.isArray(data) ? data : [];
}

/**
 * POST /api/chat/:bookingId/messages
 * Fallback to send messages via REST if Socket.io is temporarily reconnecting
 */
export async function postMessage(arg1, arg2, arg3) {
    // Accommodates:
    // (bookingId, text, token)
    // or ({ bookingId, text, token })
    let bookingId, text, token;
    if (typeof arg1 === "object" && arg1 !== null) {
        bookingId = arg1.bookingId;
        text = arg1.text;
        token = arg1.token;
    } else {
        bookingId = arg1;
        text = arg2;
        token = arg3;
    }

    const res = await fetch(`${API}/api/chat/${bookingId}/messages`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.message || `Failed to send message (${res.status})`);
    }
    return data;
}
