// ServeConnect - Week 9 Customer Reviews Test Suite
// Author: Vijay (Backend Lead) & Pratham (QA & Integration)

const mongoose = require("mongoose");
const Review = require("../models/Review");
const Booking = require("../models/Booking");
const Worker = require("../models/Worker");
const {
    createReview,
    getWorkerReviews,
    updateReview,
    deleteReview
} = require("../controllers/reviewController");

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

describe("Week 9 - Customer Reviews & Rating Engine Tests", () => {
    const customerId = new mongoose.Types.ObjectId().toString();
    const otherCustomerId = new mongoose.Types.ObjectId().toString();
    const workerId = new mongoose.Types.ObjectId().toString();
    const bookingId = new mongoose.Types.ObjectId().toString();
    const reviewId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("POST /api/reviews - createReview", () => {
        it("should reject review submission if bookingId is missing or invalid", async () => {
            const { req, res } = mockReqRes({
                body: { bookingId: "invalid_id", rating: 5, comment: "Great work!" },
                user: { _id: customerId, role: "customer" }
            });

            await createReview(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.body.message).toMatch(/valid booking id/i);
        });

        it("should reject rating less than 1 or greater than 5", async () => {
            const { req, res } = mockReqRes({
                body: { bookingId, rating: 6, comment: "Impossible score" },
                user: { _id: customerId, role: "customer" }
            });

            await createReview(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.body.message).toMatch(/between 1 and 5/i);
        });

        it("should return 404 when booking does not exist", async () => {
            jest.spyOn(Booking, "findById").mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            });

            const { req, res } = mockReqRes({
                body: { bookingId, rating: 5, comment: "Top notch" },
                user: { _id: customerId, role: "customer" }
            });

            await createReview(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.body.message).toMatch(/booking not found/i);
        });

        it("should reject customer attempting to review another user's booking with 403", async () => {
            const fakeBooking = {
                _id: bookingId,
                customerId: { _id: otherCustomerId },
                workerId: { _id: workerId },
                status: "completed"
            };

            jest.spyOn(Booking, "findById").mockReturnValue({
                populate: jest.fn().mockResolvedValue(fakeBooking)
            });

            const { req, res } = mockReqRes({
                body: { bookingId, rating: 5, comment: "Trying to review someone else" },
                user: { _id: customerId, role: "customer" }
            });

            await createReview(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.body.message).toMatch(/from your account/i);
        });

        it("should reject review if booking is not in completed or paid status", async () => {
            const fakeBooking = {
                _id: bookingId,
                customerId: { _id: customerId },
                workerId: { _id: workerId },
                status: "pending" // not completed
            };

            jest.spyOn(Booking, "findById").mockReturnValue({
                populate: jest.fn().mockResolvedValue(fakeBooking)
            });

            const { req, res } = mockReqRes({
                body: { bookingId, rating: 5, comment: "Too early" },
                user: { _id: customerId, role: "customer" }
            });

            await createReview(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.body.message).toMatch(/only permitted for completed/i);
        });

        it("should reject duplicate reviews for the same booking (one review per booking rule)", async () => {
            const fakeBooking = {
                _id: bookingId,
                customerId: { _id: customerId },
                workerId: { _id: workerId },
                status: "completed"
            };

            jest.spyOn(Booking, "findById").mockReturnValue({
                populate: jest.fn().mockResolvedValue(fakeBooking)
            });

            jest.spyOn(Review, "findOne").mockResolvedValue({
                _id: reviewId,
                booking: bookingId
            });

            const { req, res } = mockReqRes({
                body: { bookingId, rating: 5, comment: "Reviewing again" },
                user: { _id: customerId, role: "customer" }
            });

            await createReview(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.body.message).toMatch(/already reviewed/i);
        });

        it("should successfully create review and recalculate worker rating statistics", async () => {
            const fakeBooking = {
                _id: bookingId,
                customerId: { _id: customerId },
                workerId: { _id: workerId },
                status: "completed"
            };

            jest.spyOn(Booking, "findById").mockReturnValue({
                populate: jest.fn().mockResolvedValue(fakeBooking)
            });

            jest.spyOn(Review, "findOne").mockResolvedValue(null);

            const createdReviewDoc = {
                _id: reviewId,
                booking: bookingId,
                customer: customerId,
                worker: workerId,
                rating: 5,
                comment: "Excellent and on-time service!"
            };

            jest.spyOn(Review, "create").mockResolvedValue(createdReviewDoc);

            // Mock recalculation query
            jest.spyOn(Review, "find").mockResolvedValue([
                { rating: 5 },
                { rating: 4 }
            ]);
            jest.spyOn(Worker, "findByIdAndUpdate").mockResolvedValue({});

            jest.spyOn(Review, "findById").mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(createdReviewDoc)
                })
            });

            const { req, res } = mockReqRes({
                body: { bookingId, rating: 5, comment: "Excellent and on-time service!" },
                user: { _id: customerId, role: "customer" }
            });

            await createReview(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.body.message).toMatch(/submitted successfully/i);
            expect(Review.create).toHaveBeenCalledWith(expect.objectContaining({
                rating: 5,
                comment: "Excellent and on-time service!"
            }));
            expect(Worker.findByIdAndUpdate).toHaveBeenCalledWith(
                workerId,
                expect.objectContaining({
                    averageRating: 4.5,
                    totalReviews: 2
                })
            );
        });
    });

    describe("GET /api/reviews/worker/:workerId - getWorkerReviews", () => {
        it("should return reviews, averageRating, and totalReviews", async () => {
            const fakeReviews = [
                { _id: new mongoose.Types.ObjectId(), rating: 5, comment: "Superb!" },
                { _id: new mongoose.Types.ObjectId(), rating: 4, comment: "Good job." }
            ];

            jest.spyOn(Review, "find").mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockResolvedValue(fakeReviews)
                    })
                })
            });

            const { req, res } = mockReqRes({
                params: { workerId }
            });

            await getWorkerReviews(req, res);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(2);
            expect(res.body[0].comment).toBe("Superb!");
        });
    });
});
