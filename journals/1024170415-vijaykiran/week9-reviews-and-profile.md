# Week 9 Journal — Ratings, Reviews & Profile Management
**Author:** Vijay Kiran (1024170415)  
**Date:** 2026-11-14  
**Sprint:** Week 9 — Reviews System, Role Detection & User Profiles

---

## Summary

This week we added the **Verified Customer Reviews & Ratings** system, enhanced role-aware authentication detection, and built dedicated user/worker profile management views.

---

## Work Completed

### Backend — Reviews & Role-Based Auth Enhancements

1. **Reviews API (`models/Review.js`, `controllers/reviewController.js`, `routes/reviewRoutes.js`)**
   - Created `Review` schema linking `bookingId`, `userId`, `workerId`, `rating` (1–5), and `comment`.
   - Enforced one review per completed booking and prevented unverified or unauthorized review submissions.
   - Automatically recalculates and updates the worker's aggregate `rating` and `reviewCount` on new review submission.

2. **Login Role Detection (`tests/loginRoleDetection.test.js`)**
   - Enhanced `authController.js` and `authService.js` to cleanly distinguish `user`, `worker`, and `admin` roles during login and session hydration.

### Frontend — Review Modal & Profile Page

1. **`ReviewModal.jsx` & `reviewService.js`**
   - Interactive star-rating selector and review submission modal accessible from completed bookings.
2. **`Profile.jsx`**
   - Dedicated user profile page displaying account details, role badge, booking history summary, and account preferences.
3. **`ToastContext.jsx` & `ErrorBoundary.jsx`**
   - Added global toast notification system and React `ErrorBoundary` fallback UI for graceful error recovery.
