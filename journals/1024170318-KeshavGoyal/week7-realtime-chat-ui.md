# Week 7 : Real-Time Live Chat UI & Interactive Messaging Experience

**Author:** Keshav Goyal (1024170318)  
**Date:** 2026-10-28  
**Role:** Frontend UI/UX & Client State  

---

## 1. Goal

Provide an intuitive, responsive, and production-quality **real-time chat interface** allowing customers and service professionals to communicate directly from their booking cards, coordinate arrival details, share requirements, and inspect appointment context seamlessly.

---

## 2. Relevant Context

Following the Week 6 booking scheduling engine, users needed a dedicated communication channel to discuss job specifics without exchanging personal phone numbers externally. The frontend required:
1. An integrated **Live Chat** action button on customer and worker booking cards in `pages/Bookings.jsx` and `components/BookingDetailsModal.jsx`.
2. A dedicated responsive chat route (`/chat/:bookingId`) displaying the appointment context (date, time, service category, professional avatar).
3. Live bidirectional messaging powered by `socket.io-client`, accompanied by typing indicators, automated scrolling, message grouping by date, and a safe HTTP REST fallback for offline sync.

---

## 3. UI/UX Design & Engineering Implementation

### A. Chat Screen Architecture (`pages/Chat.jsx`)
- Built the complete responsive chat view featuring:
  - **Header Strip:** Peer profile avatar with initials, full name, professional category/role, live status dot, and real-time socket connection badge (`Live` vs `Connecting`).
  - **Booking Context Bar:** Inline pills displaying appointment date, scheduled time slot, and service trade so users always have appointment details in front of them.
  - **Message Stream:** Clean chat bubbles with timestamp labels, visually differentiating between outgoing messages (brand blue right-aligned) and incoming messages (white left-aligned).
  - **Date Dividers:** Dynamic grouping dividing message history by *"Today"*, *"Yesterday"*, or formatted calendar dates.
  - **Live Typing Indicator:** Animated three-dot typing indicator showing when the other party is typing.
  - **Auto-Scroll Behavior:** Utilized `useRef` to smoothly scroll to the newest message whenever new messages arrive or when typing status changes.

### B. Booking Card & Modal Integration
- Connected the **"Live Chat"** button directly on booking cards in `pages/Bookings.jsx`:
  - Active and clickable for all confirmed and active bookings.
  - Disabled with explanatory tooltip for cancelled or declined bookings.
- Integrated **"Chat Now"** button into `components/BookingDetailsModal.jsx` for quick one-click navigation.

### C. State Resilience, Empty States & Error Handling
- Designed friendly empty conversation states: instead of blank screens or misleading errors, new bookings display an inviting *"Start a conversation with your professional"* illustration and subtitle.
- Implemented error recovery with an explicit **"Retry Connection"** button and a **"Back to Bookings"** navigation shortcut.
- Implemented hybrid message delivery: uses Socket.IO when connected, with automatic REST API delivery fallback if the connection drops.

### D. Design System & WCAG 2.2 AA Compliance
- Strict adherence to WCAG 2.2 AA contrast guidelines.
- Standardized all UI icons using `lucide-react` across the entire application, eliminating all decorative emojis from buttons, tabs, and status badges.

---

## 4. Key Observations & Fixes
- **Parameter Normalization:** Resolved an issue where message loading inverted parameters, replacing it with dual loading: direct conversation bundle with fallback to `getMyBookings`.
- **Keyboard Usability:** Implemented standard desktop chat keyboard ergonomics: `Enter` sends the message immediately, while `Shift + Enter` allows multi-line input.
- **Mobile Responsive Layout:** Designed sticky input controls and dynamic height constraints (`calc(100vh - 100px)`) ensuring seamless operation on mobile screens and tablets without viewport clipping.
