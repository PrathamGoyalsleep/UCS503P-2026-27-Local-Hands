// ServeConnect - Week 8 Payment API Test Suite
// Author: Vijay (Backend Lead) & Pratham (QA & Integration)

const mongoose = require("mongoose");

// Prepare mock Stripe instance
const mockStripe = {
    paymentIntents: {
        create: jest.fn().mockResolvedValue({
            id: "pi_test_12345",
            client_secret: "pi_test_12345_secret_sample",
            amount: 75000,
            currency: "inr",
            status: "requires_payment_method"
        }),
        retrieve: jest.fn().mockResolvedValue({
            id: "pi_test_12345",
            status: "succeeded",
            amount: 75000,
            currency: "inr"
        })
    },
    webhooks: {
        constructEvent: jest.fn()
    }
};

jest.mock("../config/stripe", () => ({
    getStripe: () => mockStripe
}));

process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret_key";

const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Worker = require("../models/Worker");
const {
    createPaymentIntent,
    handleWebhook,
    getPaymentByBooking,
    getPaymentById
} = require("../controllers/paymentController");

// Helper to create mock req and res
const mockReqRes = (overrides = {}) => {
    const req = {
        body: {},
        params: {},
        query: {},
        headers: {},
        user: { _id: new mongoose.Types.ObjectId().toString(), id: "", role: "customer" },
        ...overrides
    };
    if (!req.user.id && req.user._id) req.user.id = req.user._id.toString();

    const res = {
        statusCode: 200,
        body: null,
        status: jest.fn().mockImplementation(function (code) {
            this.statusCode = code;
            return this;
        }),
        json: jest.fn().mockImplementation(function (data) {
            this.body = data;
            return this;
        }),
        send: jest.fn().mockImplementation(function (data) {
            this.body = data;
            return this;
        })
    };

    return { req, res };
};

describe("Week 8 - In-App Stripe Payments & Security Tests", () => {
    const customerId = new mongoose.Types.ObjectId().toString();
    const otherCustomerId = new mongoose.Types.ObjectId().toString();
    const workerUserId = new mongoose.Types.ObjectId().toString();
    const bookingId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret_key";
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("POST /api/payments/create-payment-intent", () => {
        it("should reject with 400 when bookingId is missing or invalid", async () => {
            const { req, res } = mockReqRes({
                body: { bookingId: "invalid_id" },
                user: { _id: customerId, role: "customer" }
            });

            await createPaymentIntent(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.body.message).toMatch(/valid booking id/i);
        });

        it("should return 404 when booking does not exist", async () => {
            jest.spyOn(Booking, "findById").mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            });

            const { req, res } = mockReqRes({
                body: { bookingId },
                user: { _id: customerId, role: "customer" }
            });

            await createPaymentIntent(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.body.message).toMatch(/booking not found/i);
        });

        it("should return 403 when customer does not own the booking", async () => {
            const fakeBooking = {
                _id: bookingId,
                customerId: { _id: otherCustomerId },
                status: "completed",
                paymentStatus: "unpaid",
                estimatedPrice: 750
            };

            jest.spyOn(Booking, "findById").mockReturnValue({
                populate: jest.fn().mockResolvedValue(fakeBooking)
            });

            const { req, res } = mockReqRes({
                body: { bookingId },
                user: { _id: customerId, role: "customer" }
            });

            await createPaymentIntent(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.body.message).toMatch(/not authorized/i);
        });

        it("should return 400 when booking status is not completed (e.g. pending)", async () => {
            const fakeBooking = {
                _id: bookingId,
                customerId: { _id: customerId },
                status: "pending",
                paymentStatus: "unpaid",
                estimatedPrice: 750
            };

            jest.spyOn(Booking, "findById").mockReturnValue({
                populate: jest.fn().mockResolvedValue(fakeBooking)
            });

            const { req, res } = mockReqRes({
                body: { bookingId },
                user: { _id: customerId, role: "customer" }
            });

            await createPaymentIntent(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.body.message).toMatch(/completed/i);
        });

        it("should prevent duplicate payments when booking is already paid", async () => {
            const fakeBooking = {
                _id: bookingId,
                customerId: { _id: customerId },
                status: "completed",
                paymentStatus: "paid",
                estimatedPrice: 750
            };

            jest.spyOn(Booking, "findById").mockReturnValue({
                populate: jest.fn().mockResolvedValue(fakeBooking)
            });

            const { req, res } = mockReqRes({
                body: { bookingId },
                user: { _id: customerId, role: "customer" }
            });

            await createPaymentIntent(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.body.message).toMatch(/already.*paid/i);
        });

        it("should calculate trusted amount strictly server-side and ignore client-supplied amount", async () => {
            const fakeBooking = {
                _id: bookingId,
                customerId: { _id: customerId, name: "Vijay Customer", email: "vijay@example.com" },
                workerId: { category: "Plumber", charges: 750 },
                status: "completed",
                paymentStatus: "unpaid",
                estimatedPrice: 750,
                save: jest.fn().mockResolvedValue(true)
            };

            jest.spyOn(Booking, "findById").mockReturnValue({
                populate: jest.fn().mockResolvedValue(fakeBooking)
            });

            jest.spyOn(Payment, "findOne").mockResolvedValue(null);
            jest.spyOn(Payment, "create").mockResolvedValue({
                _id: new mongoose.Types.ObjectId(),
                stripePaymentIntentId: "pi_test_12345",
                booking: bookingId,
                customer: customerId,
                amount: 750,
                currency: "inr",
                status: "requires_payment_method"
            });

            const { req, res } = mockReqRes({
                body: {
                    bookingId,
                    // Malicious client tries to inject a tiny amount
                    amount: 1,
                    price: 1
                },
                user: { _id: customerId, role: "customer" }
            });

            await createPaymentIntent(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.body).toHaveProperty("clientSecret", "pi_test_12345_secret_sample");
            expect(res.body).toHaveProperty("amount", 750); // Untrusted client amount ignored!
            expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    amount: 75000, // 750 * 100 paise
                    currency: "inr",
                    metadata: expect.objectContaining({
                        bookingId: bookingId.toString()
                    })
                }),
                expect.objectContaining({
                    idempotencyKey: expect.stringContaining(`pay_intent_booking_${bookingId}`)
                })
            );
        });
    });

    describe("POST /api/payments/webhook", () => {
        it("should return 400 when Stripe signature verification fails", async () => {
            mockStripe.webhooks.constructEvent.mockImplementation(() => {
                throw new Error("Invalid signature verification header");
            });

            const { req, res } = mockReqRes({
                headers: { "stripe-signature": "bad_signature" },
                rawBody: Buffer.from(JSON.stringify({ type: "payment_intent.succeeded" }))
            });

            await handleWebhook(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.body).toMatch(/invalid signature/i);
        });

        it("should process payment_intent.succeeded and update booking and payment to paid", async () => {
            const mockEvent = {
                type: "payment_intent.succeeded",
                data: {
                    object: {
                        id: "pi_test_12345",
                        amount: 75000,
                        status: "succeeded",
                        metadata: {
                            bookingId: bookingId.toString(),
                            customerId: customerId.toString()
                        },
                        charges: {
                            data: [{ receipt_url: "https://stripe.com/receipt/sample" }]
                        }
                    }
                }
            };

            mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

            const mockPayment = {
                _id: new mongoose.Types.ObjectId(),
                stripePaymentIntentId: "pi_test_12345",
                status: "requires_payment_method",
                booking: bookingId,
                save: jest.fn().mockResolvedValue(true)
            };

            jest.spyOn(Payment, "findOne").mockResolvedValue(mockPayment);
            jest.spyOn(Booking, "findByIdAndUpdate").mockResolvedValue({ _id: bookingId });

            const { req, res } = mockReqRes({
                headers: { "stripe-signature": "valid_sig" },
                rawBody: Buffer.from(JSON.stringify(mockEvent))
            });

            await handleWebhook(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.body).toEqual({ received: true });
            expect(mockPayment.status).toBe("succeeded");
            expect(mockPayment.save).toHaveBeenCalled();
            expect(Booking.findByIdAndUpdate).toHaveBeenCalledWith(
                bookingId,
                expect.objectContaining({ paymentStatus: "paid" })
            );
        });

        it("should handle payment_intent.payment_failed gracefully", async () => {
            const mockEvent = {
                type: "payment_intent.payment_failed",
                data: {
                    object: {
                        id: "pi_test_12345",
                        booking: bookingId,
                        last_payment_error: { message: "Card declined insufficient funds" },
                        metadata: { bookingId: bookingId.toString() }
                    }
                }
            };

            mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

            const mockPayment = {
                _id: new mongoose.Types.ObjectId(),
                stripePaymentIntentId: "pi_test_12345",
                booking: bookingId,
                status: "requires_payment_method",
                save: jest.fn().mockResolvedValue(true)
            };

            jest.spyOn(Payment, "findOne").mockResolvedValue(mockPayment);
            jest.spyOn(Booking, "findByIdAndUpdate").mockResolvedValue({ _id: bookingId });

            const { req, res } = mockReqRes({
                headers: { "stripe-signature": "valid_sig" },
                rawBody: Buffer.from(JSON.stringify(mockEvent))
            });

            await handleWebhook(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.body).toEqual({ received: true });
            expect(mockPayment.status).toBe("failed");
            expect(mockPayment.save).toHaveBeenCalled();
        });
    });

    describe("GET /api/payments/booking/:bookingId", () => {
        it("should return 404 when booking does not exist", async () => {
            jest.spyOn(Booking, "findById").mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            });

            const { req, res } = mockReqRes({
                params: { bookingId },
                user: { _id: customerId, role: "customer" }
            });

            await getPaymentByBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.body.message).toMatch(/booking not found/i);
        });

        it("should return 403 when an unauthorized customer requests payment info for another user", async () => {
            const fakeBooking = {
                _id: bookingId,
                customerId: { _id: otherCustomerId },
                workerId: { userId: workerUserId }
            };

            jest.spyOn(Booking, "findById").mockReturnValue({
                populate: jest.fn().mockResolvedValue(fakeBooking)
            });

            const { req, res } = mockReqRes({
                params: { bookingId },
                user: { _id: customerId, role: "customer" }
            });

            await getPaymentByBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.body.message).toMatch(/not authorized/i);
        });

        it("should return 404 when booking exists but no payment record is found", async () => {
            const fakeBooking = {
                _id: bookingId,
                customerId: { _id: customerId },
                workerId: { userId: workerUserId }
            };

            jest.spyOn(Booking, "findById").mockReturnValue({
                populate: jest.fn().mockResolvedValue(fakeBooking)
            });

            jest.spyOn(Payment, "findOne").mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue(null)
                })
            });

            const { req, res } = mockReqRes({
                params: { bookingId },
                user: { _id: customerId, role: "customer" }
            });

            await getPaymentByBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.body.message).toMatch(/no payment record found/i);
        });
    });
});
