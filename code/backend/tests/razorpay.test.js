// ServeConnect — Razorpay Payment Gateway Test Suite
// Verifies Razorpay order creation, server-side amount calculation,
// HMAC-SHA256 signature verification, and booking settlement.

const mongoose = require("mongoose");
const crypto = require("crypto");

const mockOrder = {
    id: "order_test_12345",
    entity: "order",
    amount: 45000,
    amount_paid: 0,
    amount_due: 45000,
    currency: "INR",
    receipt: "rcpt_sample",
    status: "created"
};

jest.mock("../config/razorpay", () => {
    const cryptoModule = require("crypto");
    return {
        getRazorpayCredentials: () => ({
            keyId: "rzp_test_TzD2HJ21AaGT8M",
            keySecret: "Kf8Pkk8KSnk7Ve0Wy6c9rvux"
        }),
        isRazorpayConfigured: () => true,
        createRazorpayOrder: jest.fn().mockResolvedValue(mockOrder),
        verifyRazorpaySignature: jest.fn(({ orderId, paymentId, signature }) => {
            const expected = cryptoModule
                .createHmac("sha256", "Kf8Pkk8KSnk7Ve0Wy6c9rvux")
                .update(`${orderId}|${paymentId}`)
                .digest("hex");
            return expected === signature;
        })
    };
});

const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const {
    createRazorpayOrderHandler,
    verifyRazorpayPaymentHandler
} = require("../controllers/paymentController");

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
        })
    };

    return { req, res };
};

describe("Razorpay Payment Gateway Tests", () => {
    const customerId = new mongoose.Types.ObjectId().toString();
    const otherCustomerId = new mongoose.Types.ObjectId().toString();
    const bookingId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("POST /api/payments/razorpay/create-order", () => {
        it("should reject with 400 when bookingId is missing", async () => {
            const { req, res } = mockReqRes({
                body: {},
                user: { _id: customerId, role: "customer" }
            });

            await createRazorpayOrderHandler(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.body.message).toContain("Valid booking ID is required");
        });

        it("should return 404 when booking does not exist", async () => {
            jest.spyOn(Booking, "findById").mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            });

            const { req, res } = mockReqRes({
                body: { bookingId },
                user: { _id: customerId, role: "customer" }
            });

            await createRazorpayOrderHandler(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.body.message).toContain("Booking not found");
        });

        it("should return 403 when requesting customer does not own the booking", async () => {
            const mockBooking = {
                _id: bookingId,
                customerId: otherCustomerId,
                status: "completed"
            };

            jest.spyOn(Booking, "findById").mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockBooking)
            });

            const { req, res } = mockReqRes({
                body: { bookingId },
                user: { _id: customerId, role: "customer" }
            });

            await createRazorpayOrderHandler(req, res);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.body.message).toContain("not authorized");
        });

        it("should return 400 when booking is not in completed status", async () => {
            const mockBooking = {
                _id: bookingId,
                customerId: customerId,
                status: "pending"
            };

            jest.spyOn(Booking, "findById").mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockBooking)
            });

            const { req, res } = mockReqRes({
                body: { bookingId },
                user: { _id: customerId, role: "customer" }
            });

            await createRazorpayOrderHandler(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.body.message).toContain("Only accepted or completed bookings can be paid");
        });

        it("should successfully create a Razorpay order for an eligible completed booking", async () => {
            const mockBooking = {
                _id: bookingId,
                customerId: customerId,
                workerId: { _id: new mongoose.Types.ObjectId(), category: "Plumbing", charges: 450 },
                status: "completed",
                paymentStatus: "unpaid",
                service: "Plumbing Repair",
                date: "2026-11-15",
                time: "10:00 AM",
                estimatedPrice: 450,
                save: jest.fn().mockResolvedValue(true)
            };

            jest.spyOn(Booking, "findById").mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockBooking)
            });
            jest.spyOn(Payment, "findOne").mockResolvedValue(null);
            jest.spyOn(Payment, "create").mockResolvedValue({
                _id: new mongoose.Types.ObjectId(),
                booking: bookingId,
                razorpayOrderId: "order_test_12345",
                amount: 450
            });

            const { req, res } = mockReqRes({
                body: { bookingId },
                user: { _id: customerId, role: "customer" }
            });

            await createRazorpayOrderHandler(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.body).toHaveProperty("orderId", "order_test_12345");
            expect(res.body).toHaveProperty("keyId", "rzp_test_TzD2HJ21AaGT8M");
            expect(res.body.amount).toBe(450);
            expect(mockBooking.save).toHaveBeenCalled();
        });
    });

    describe("POST /api/payments/razorpay/verify", () => {
        it("should reject with 400 when required verification params are missing", async () => {
            const { req, res } = mockReqRes({
                body: { bookingId },
                user: { _id: customerId, role: "customer" }
            });

            await verifyRazorpayPaymentHandler(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.body.message).toContain("Missing required payment verification parameters");
        });

        it("should return 400 when Razorpay signature verification fails", async () => {
            const mockBooking = {
                _id: bookingId,
                customerId: customerId,
                status: "completed",
                save: jest.fn().mockResolvedValue(true)
            };

            jest.spyOn(Booking, "findById").mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockBooking)
            });

            const { req, res } = mockReqRes({
                body: {
                    bookingId,
                    razorpayOrderId: "order_test_12345",
                    razorpayPaymentId: "pay_test_99999",
                    razorpaySignature: "invalid_tampered_signature"
                },
                user: { _id: customerId, role: "customer" }
            });

            await verifyRazorpayPaymentHandler(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.body.message).toContain("Invalid signature");
        });

        it("should successfully verify payment with valid HMAC signature and mark booking as paid", async () => {
            const orderId = "order_test_12345";
            const paymentId = "pay_test_99999";
            const validSignature = crypto
                .createHmac("sha256", "Kf8Pkk8KSnk7Ve0Wy6c9rvux")
                .update(`${orderId}|${paymentId}`)
                .digest("hex");

            const mockBooking = {
                _id: bookingId,
                customerId: customerId,
                status: "completed",
                paymentStatus: "pending",
                save: jest.fn().mockResolvedValue(true)
            };

            const mockPayment = {
                _id: new mongoose.Types.ObjectId(),
                booking: bookingId,
                razorpayOrderId: orderId,
                amount: 450,
                status: "requires_payment_method",
                save: jest.fn().mockResolvedValue(true)
            };

            jest.spyOn(Booking, "findById").mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockBooking)
            });
            jest.spyOn(Payment, "findOne").mockResolvedValue(mockPayment);

            const { req, res } = mockReqRes({
                body: {
                    bookingId,
                    razorpayOrderId: orderId,
                    razorpayPaymentId: paymentId,
                    razorpaySignature: validSignature
                },
                user: { _id: customerId, role: "customer" }
            });

            await verifyRazorpayPaymentHandler(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.body.success).toBe(true);
            expect(mockPayment.status).toBe("succeeded");
            expect(mockPayment.razorpayPaymentId).toBe(paymentId);
            expect(mockBooking.status).toBe("paid");
            expect(mockBooking.paymentStatus).toBe("paid");
        });
    });
});
