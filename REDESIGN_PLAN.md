# ServeConnect Full UI/UX Redesign Plan

## 1. Executive Summary & Design Direction
ServeConnect is being refined into a commercial, high-trust home-services marketplace inspired by the polish and clarity of Thumbtack, Angi, and Taskrabbit, unified under a consistent design system.
- **Font:** Plus Jakarta Sans (`400`, `500`, `600`, `700`, `800`)
- **Theme:** Warm Blue & White (`#2563EB`, `#142B55`, `#F1F5FC`, `#FFFFFF`, `#DCE6F5`)
- **Container Scale:** Default `max-width: 1360px` (extended to `1440px` for Admin & Chat views)
- **Library Additions:** `framer-motion` (restrained page transitions, modal spring, card grid reveals, tab sliders)

---

## 2. Token Mapping Table
Defined globally in `src/index.css` via CSS variables:

| Token Name | Hex Value | Purpose / Usage |
|---|---|---|
| `--color-primary` | `#2563EB` | Primary brand blue, action buttons, active tabs |
| `--color-navy` | `#142B55` | Deep navy headers, card headings, strong typography |
| `--color-secondary` | `#3B82F6` | Secondary blue, highlights, hover borders |
| `--color-indigo` | `#6366F1` | Accent badges, category tags |
| `--color-teal` | `#0D9488` | Payment confirmations, paid status, trust badges |
| `--color-purple` | `#8B5CF6` | Specialty services accent (e.g. deep cleaning) |
| `--color-amber` | `#F59E0B` | Pending status, star ratings, review actions |
| `--color-bg-soft` | `#F1F5FC` | Main application body background |
| `--color-bg-secondary` | `#EAF1FC` | Section alternating backgrounds, subtle panels |
| `--color-surface` | `#FFFFFF` | Card surface, modal surface, elevated elements |
| `--color-text-primary` | `#172554` | Headings, titles, high-contrast labels |
| `--color-text-secondary`| `#64748B` | Subtext, timestamps, metadata, captions |
| `--color-border` | `#DCE6F5` | Unified card and divider borders |
| `--color-border-subtle` | `#EBF1FA` | Internal card dividers, table row borders |
| `--radius-sm` | `8px` | Badges, small inputs, action tags |
| `--radius-md` | `12px` | Buttons, standard inputs, cards, dropdowns |
| `--radius-lg` | `16px` | Floating cards, modal dialogs, hero elements |
| `--shadow-card` | `0 4px 14px rgba(20, 43, 85, 0.05)` | Default card depth |
| `--shadow-hover` | `0 12px 28px -4px rgba(20, 43, 85, 0.1)` | Hover elevated state |

---

## 3. Component Inventory (`src/components/ui/`)
All created as plain CSS + small JSX primitives with consistent focus rings, accessible labels, and hover states:
1. `Button.jsx`: Primary, Secondary, Outline, Danger, Ghost, with `loading` spinner and icon slots.
2. `Input.jsx` / `Select.jsx` / `Textarea.jsx`: Form controls with floating labels, error messages, and helper hints.
3. `SearchBar.jsx`: Unified location and category search component.
4. `Card.jsx`: Surface wrapper with elevation and border tokens.
5. `StatCard.jsx`: Metric display card with colored icon container and value.
6. `ProfessionalCard.jsx`: Reusable worker listing card for Search and Home.
7. `BookingCard.jsx`: 2-column rectangular booking card.
8. `StatusBadge.jsx`: Unified status indicator (pending, accepted, completed, paid, declined).
9. `Avatar.jsx`: User/pro photo with graceful initial fallback and verification check.
10. `RatingStars.jsx`: Rating score display with filled/half/empty stars.
11. `EmptyState.jsx`: Clean state with illustration icon, heading, text, and action CTA.
12. `Skeleton.jsx`: Pulse shimmering placeholders for cards, rows, and text.
13. `Modal.jsx`: Shared modal shell with escape listener, backdrop blur, and focus handling.
14. `Tabs.jsx`: Filter and navigation tab pills with active highlight.
15. `SectionHeader.jsx`: Consistent section title, kicker, and subtitle across pages.

---

## 4. Phase Order & File Modification Schedule

### Phase 1: Tokens, Typography & Base CSS
- Update Google Fonts import in `index.html` and `index.css` to **Plus Jakarta Sans**.
- Define complete `:root` token variables and backwards-compatible aliases.
- Normalize container styles (`.sc-container` with `max-width: 1360px`).
- Install and configure `framer-motion`.

### Phase 2: Core UI Primitives & Shell
- Implement `src/components/ui/*`.
- Refactor `Navbar.jsx` with new tokens, location dropdown, and responsive drawer.
- Refactor `Footer.jsx` with brand styling and 4-column layout.
- Wrap routes in `App.jsx` with `AnimatePresence` and gentle page transitions.

### Phase 3: Customer Pages
- `Home.jsx`: Centered hero search, verified category cards, real featured pros from `getWorkers`, trust strip, How It Works, FAQ accordion.
- `Search.jsx`: Sticky filter bar, responsive grid, rating/price filters, professional cards.
- `WorkerProfile.jsx` & `WorkerProfileModal.jsx`: Full-page profile layout, booking flow preservation, availability time slot picker.
- `Bookings.jsx`: Dynamic 5-metric stats, filter tabs, 2-column rectangular cards, modals.
- `Chat.jsx`: Full-height chat interface, responsive thread view, live socket messaging.
- `Login.jsx` & `Register.jsx`: Split-screen branded auth experience.

### Phase 4: Worker Experience (Embedded in `Profile.jsx` & `WorkerRegistration.jsx`)
- `Profile.jsx`: Worker role dashboard (earnings, active jobs, acceptance rate, booking records).
- `WorkerRegistration.jsx`: Step progress bar, trade selection cards, photo upload preview.

### Phase 5: Admin Experience
- `AdminDashboard.jsx`: Metric cards, filterable applicant table, verification actions.
- `AdminWorkerReviewModal.jsx`: ID vetting, document preview, approve/reject decisions.

### Phase 6: Modals & Dialogs
- `BookingDetailsModal.jsx`, `PaymentModal.jsx`, `ReviewModal.jsx`, `ConfirmDialog.jsx`.

### Phase 7: Verification & Testing
- Vite production build (`npm run build`).
- ESLint verification (`npm run lint`).
- Manual flow testing & test matrix generation.

---

## 5. Risk Assessment & Preservation Safeguards
1. **API & Service Protection:** Zero modifications to `src/services/*`. All request parameters, response mapping, and error structures remain identical.
2. **Payment Flow Integrity:** Razorpay and Stripe SDK integrations inside `PaymentModal.jsx` are strictly preserved without tampering with order payload structures.
3. **Socket.IO Event Integrity:** All chat room joins, message broadcasts, and typing notifications in `Chat.jsx` are preserved verbatim.
4. **Auth State Preservation:** JWT token storage, `AuthContext` user updates, and role routes (`ProtectedRoute`, `RoleRoute`) remain completely intact.
