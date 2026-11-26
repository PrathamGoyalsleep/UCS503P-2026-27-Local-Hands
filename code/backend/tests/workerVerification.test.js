// ServeConnect - Week 9 Worker Verification & Document Upload Test Suite
// Author: Vijay (Backend Lead) & Pratham (QA & Integration)

const mongoose = require("mongoose");
const Worker = require("../models/Worker");
const Booking = require("../models/Booking");
const {
    updateBookingStatus
} = require("../controllers/bookingController");
const {
    approveWorker,
    rejectWorker
} = require("../controllers/adminController");
const {
    uploadWorkerProfileImage,
    uploadWorkerDocument
} = require("../controllers/workerController");

const mockReqRes = (overrides = {}) => {
    const req = {
        body: {},
        params: {},
        query: {},
        headers: {},
        user: { _id: new mongoose.Types.ObjectId().toString(), id: "", role: "worker" },
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

describe("Week 9 - Worker Verification & Trust System Tests", () => {
    const workerUserId = new mongoose.Types.ObjectId().toString();
    const workerProfileId = new mongoose.Types.ObjectId().toString();
    const bookingId = new mongoose.Types.ObjectId().toString();
    const adminId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("Booking Acceptance Gate - Unverified Worker Protection", () => {
        it("should block unverified worker (pending) from accepting bookings with 403", async () => {
            const fakeBooking = {
                _id: bookingId,
                workerId: {
                    _id: workerProfileId,
                    status: "pending",
                    verificationStatus: "pending"
                },
                status: "pending",
                save: jest.fn()
            };

            jest.spyOn(Booking, "findById").mockReturnValue({
                populate: jest.fn().mockResolvedValue(fakeBooking)
            });

            const { req, res } = mockReqRes({
                params: { id: bookingId },
                body: { status: "accepted" },
                user: { _id: workerUserId, role: "worker" }
            });

            await updateBookingStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.body.message).toMatch(/only verified and approved professionals/i);
            expect(fakeBooking.save).not.toHaveBeenCalled();
        });

        it("should block rejected worker from accepting bookings with 403", async () => {
            const fakeBooking = {
                _id: bookingId,
                workerId: {
                    _id: workerProfileId,
                    status: "rejected",
                    verificationStatus: "rejected"
                },
                status: "pending",
                save: jest.fn()
            };

            jest.spyOn(Booking, "findById").mockReturnValue({
                populate: jest.fn().mockResolvedValue(fakeBooking)
            });

            const { req, res } = mockReqRes({
                params: { id: bookingId },
                body: { status: "accepted" },
                user: { _id: workerUserId, role: "worker" }
            });

            await updateBookingStatus(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.body.message).toMatch(/only verified and approved/i);
        });

        it("should allow verified and approved worker to accept bookings", async () => {
            const fakeBooking = {
                _id: bookingId,
                workerId: {
                    _id: workerProfileId,
                    status: "approved",
                    verificationStatus: "approved"
                },
                status: "pending",
                save: jest.fn().mockResolvedValue(true)
            };

            jest.spyOn(Booking, "findById").mockReturnValue({
                populate: jest.fn().mockResolvedValue(fakeBooking)
            });

            const { req, res } = mockReqRes({
                params: { id: bookingId },
                body: { status: "accepted" },
                user: { _id: workerUserId, role: "worker" }
            });

            await updateBookingStatus(req, res);

            expect(res.status).not.toHaveBeenCalledWith(403);
            expect(fakeBooking.status).toBe("accepted");
            expect(fakeBooking.save).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(fakeBooking);
        });
    });

    describe("Cloudinary Upload Integration", () => {
        it("should reject profile image upload if file is missing", async () => {
            const { req, res } = mockReqRes({
                file: null,
                user: { _id: workerUserId, role: "worker" }
            });

            await uploadWorkerProfileImage(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.body.message).toMatch(/no image file/i);
        });

        it("should reject profile image upload if file is not an image", async () => {
            const { req, res } = mockReqRes({
                file: { buffer: Buffer.from("pdf-data"), mimetype: "application/pdf" },
                user: { _id: workerUserId, role: "worker" }
            });

            await uploadWorkerProfileImage(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.body.message).toMatch(/only image files/i);
        });

        it("should upload profile image and update worker record with Cloudinary URL", async () => {
            const fakeWorker = {
                _id: workerProfileId,
                userId: workerUserId,
                photo: "",
                profileImage: "",
                profileImagePublicId: "",
                save: jest.fn().mockResolvedValue(true)
            };

            jest.spyOn(Worker, "findOne").mockResolvedValue(fakeWorker);

            const { req, res } = mockReqRes({
                file: { buffer: Buffer.from("fake-image-bytes") },
                user: { _id: workerUserId, role: "worker" }
            });

            await uploadWorkerProfileImage(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: "Profile image uploaded successfully"
            }));
            expect(fakeWorker.profileImage).toMatch(/cloudinary/i);
            expect(fakeWorker.save).toHaveBeenCalled();
        });

        it("should upload trade document/certificate and store Cloudinary metadata", async () => {
            const fakeWorker = {
                _id: workerProfileId,
                userId: workerUserId,
                documents: [],
                certificates: [],
                save: jest.fn().mockResolvedValue(true)
            };

            jest.spyOn(Worker, "findOne").mockResolvedValue(fakeWorker);

            const { req, res } = mockReqRes({
                file: { buffer: Buffer.from("fake-pdf-bytes"), originalname: "plumbing_cert.pdf" },
                body: { title: "National Plumber Trade Certificate", docType: "Government License" },
                user: { _id: workerUserId, role: "worker" }
            });

            await uploadWorkerDocument(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: "Document uploaded successfully"
            }));
            expect(fakeWorker.documents.length).toBe(1);
            expect(fakeWorker.certificates.length).toBe(1);
            expect(fakeWorker.documents[0].url).toMatch(/cloudinary/i);
            expect(fakeWorker.save).toHaveBeenCalled();
        });
    });

    describe("Admin Worker Verification Lifecycle", () => {
        it("should approve worker application and set status to approved", async () => {
            const fakeWorker = {
                _id: workerProfileId,
                status: "pending",
                verificationStatus: "pending",
                save: jest.fn().mockResolvedValue(true),
                populate: jest.fn().mockReturnThis()
            };

            // First call finds worker to mutate, second call finds populated worker to return
            let callCount = 0;
            jest.spyOn(Worker, "findById").mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    return Promise.resolve(fakeWorker);
                }
                return {
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockResolvedValue({
                            ...fakeWorker,
                            status: "approved"
                        })
                    })
                };
            });

            const { req, res } = mockReqRes({
                params: { id: workerProfileId },
                user: { _id: adminId, role: "admin" }
            });

            await approveWorker(req, res);

            expect(fakeWorker.status).toBe("approved");
            expect(fakeWorker.save).toHaveBeenCalled();
        });

        it("should reject worker application with an admin reason", async () => {
            const fakeWorker = {
                _id: workerProfileId,
                status: "pending",
                verificationStatus: "pending",
                rejectionReason: "",
                save: jest.fn().mockResolvedValue(true),
                populate: jest.fn().mockReturnThis()
            };

            let callCount = 0;
            jest.spyOn(Worker, "findById").mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    return Promise.resolve(fakeWorker);
                }
                return {
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockResolvedValue({
                            ...fakeWorker,
                            status: "rejected",
                            rejectionReason: "Submitted certificate is expired"
                        })
                    })
                };
            });

            const { req, res } = mockReqRes({
                params: { id: workerProfileId },
                body: { reason: "Submitted certificate is expired" },
                user: { _id: adminId, role: "admin" }
            });

            await rejectWorker(req, res);

            expect(fakeWorker.status).toBe("rejected");
            expect(fakeWorker.rejectionReason).toBe("Submitted certificate is expired");
            expect(fakeWorker.save).toHaveBeenCalled();
        });
    });
});
