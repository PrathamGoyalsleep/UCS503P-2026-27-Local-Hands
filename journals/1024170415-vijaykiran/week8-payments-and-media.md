# Week 8 Journal — Payment Gateway Integration & Media Uploads
**Author:** Vijay Kiran (1024170415)  
**Date:** 2026-11-05  
**Sprint:** Week 8 — Razorpay / Stripe Payments & Cloudinary Uploads

---

## Summary

This week we implemented the end-to-end payment infrastructure supporting both **Razorpay** and **Stripe**, built a transparent pricing calculator utility, and integrated **Cloudinary** for secure worker document and portfolio media uploads.

---

## Work Completed

### Backend — Payment Engine & Media Pipeline

1. **Payment Model & Controllers (`models/Payment.js`, `controllers/paymentController.js`, `routes/paymentRoutes.js`)**
   - Created `Payment` schema tracking `bookingId`, `userId`, `workerId`, `amount`, `currency`, `provider` (`razorpay` / `stripe`), `orderId`, `paymentId`, `signature`, and `status`.
   - Implemented **Razorpay** order creation (`POST /api/payments/razorpay/order`) and HMAC SHA-256 signature verification (`POST /api/payments/razorpay/verify`).
   - Implemented **Stripe** PaymentIntent creation and webhook signature verification.
   - Automatically updates `Booking.paymentStatus` to `paid` upon verified checkout.

2. **Pricing Calculator (`utils/pricingCalculator.js`)**
   - Centralized hourly charge, duration multiplier, and platform fee calculation shared between backend validation and frontend checkout previews.

3. **Cloudinary Upload Pipeline (`config/cloudinary.js`, `middleware/uploadMiddleware.js`)**
   - Configured Multer + Cloudinary storage for worker profile avatars, ID verification documents, and portfolio work samples.
   - Added `scripts/verifyCloudinaryLive.js` to validate live upload credentials.

### Frontend — Checkout & Upload Integration

1. **`PaymentModal.jsx` & `paymentService.js`**
   - Built interactive checkout modal with itemized pricing breakdown, Razorpay SDK integration, and payment confirmation receipts.
2. **`ConfirmDialog.jsx`**
   - Added reusable confirmation dialog for destructive or payment-related booking actions.

---

## Testing

- ✅ `tests/payment.test.js` — Stripe PaymentIntent creation and webhook signature verification.
- ✅ `tests/razorpay.test.js` — Razorpay order creation, valid signature verification, and invalid signature rejection.
- ✅ `tests/workerVerification.test.js` — Worker approval/rejection and transactional email pipeline.
