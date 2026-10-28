# Week 7 Journal — Real-Time Live Chat
**Author:** Vijay Kiran (1024170415)  
**Date:** 2026-10-27  
**Sprint:** Week 7 — Real-Time Chat (Advanced Feature)

---

## Summary

This week we implemented a **production-quality, real-time bidirectional chat system** using Socket.io, allowing customers and service professionals to communicate directly within the context of their booking.

---

## Work Completed

### Backend — Socket.io Server & Message Persistence

1. **Upgraded `server.js` to Socket.io-enabled HTTP server**
   - Replaced raw `app.listen()` with `http.createServer(app)` and attached `socket.io` to it.
   - Configured `socket.io` CORS to allow connections from the Vite frontend (`http://localhost:5173`).

2. **JWT Authentication for Socket Connections**
   - Every socket handshake passes the user's JWT token via `socket.handshake.auth.token`.
   - The server verifies the token and fetches the full user record (name, role) from MongoDB and attaches it to `socket.user`.
   - Unauthenticated sockets are rejected before connection is established.

3. **Socket Events Implemented**
   - `join_room(bookingId)` — join a private booking room channel.
   - `leave_room(bookingId)` — clean exit from the room channel.
   - `send_message({ bookingId, text })` — validates, persists to MongoDB, and broadcasts to all room members.
   - `typing_start / typing_stop` — live typing indicator relay.
   - `receive_message` — the event clients listen to for new messages.
   - `chat_error` — emitted back to sender on failure.

4. **Message Model (`models/Message.js`)** — Updated schema:
   - `bookingId` (indexed) — links message to booking room.
   - `senderId` — ObjectId ref to User.
   - `senderName` / `senderRole` — denormalized for fast render without population.
   - `text` — max 2000 chars.
   - `readBy` — array of user IDs (foundation for read receipts).

5. **Chat REST API (`routes/chatRoutes.js`, `controllers/chatController.js`)**
   - `GET /api/chat/:bookingId/messages` — load full message history (protected, only booking parties).
   - `POST /api/chat/:bookingId/messages` — REST fallback for message persistence.

---

### Frontend — Professional Chat UI

1. **`Chat.jsx` — Full chat page component**
   - Socket.io client connects on mount with JWT token in auth handshake.
   - Loads message history via REST on mount, then receives new messages via Socket.io.
   - **Typing indicators** — detects keystrokes and emits `typing_start`/`typing_stop` events with 1.5s debounce.
   - **Date grouping** — messages grouped by "Today", "Yesterday", or formatted date.
   - **Live/Offline badge** — shows real-time connection status.
   - **Booking context strip** — shows date, time, and service category in the header.
   - **Enter to send** — Shift+Enter for newlines, Enter to send.
   - **Auto-scroll** — scrolls to newest message automatically.
   - **Avatar component** — auto-generates colored initials avatars with deterministic color from name.

2. **`Bookings.jsx` — Chat button added to each booking card**
   - "Chat" button navigates to `/chat/:bookingId`.
   - Only active (enabled with blue color) when booking is `accepted` or `completed`.
   - Disabled (grey) for `pending` and `rejected` bookings.

3. **Route `/chat/:bookingId`** — Added as a `ProtectedRoute` in `App.jsx`.

4. **`chatService.js`** — Thin fetch wrapper for REST message history endpoint.

---

## Installed Dependencies

| Package | Side | Purpose |
| :--- | :--- | :--- |
| `socket.io` | Backend | WebSocket server engine |
| `socket.io-client` | Frontend | WebSocket client for React |

---

## Testing

- ✅ Two browser windows with different user accounts.
- ✅ Messages appear instantly in both windows without page refresh.
- ✅ Typing indicator appears in peer's window while typing.
- ✅ Messages persist in MongoDB (verified via DB inspection).
- ✅ Auth-invalid sockets are rejected at handshake.
- ✅ Frontend build: `vite build` exits code 0, 75 modules, no errors.

---

## Challenges

- **JWT payload** only contained `id` — had to resolve `name` and `role` from DB in socket middleware.
- **Message deduplication** — socket broadcast + REST history load could cause duplicates; guarded with `find()` by `_id` in state.
- **CRLF line endings** on Windows caused some file edit tools to fail exact-match; resolved by full-file rewrites.

