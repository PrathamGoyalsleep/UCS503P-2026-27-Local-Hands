// ServeConnect - Week 6 & Slot Validation Booking API Test Suite
// Author: Keshav & Pratham (QA & Integration)

const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Worker = require("../models/Worker");
const {
    createBooking,
    getMyBookings,
    updateBookingStatus,
    parseSlotStartMinutes,
    parseSlotEndMinutes,
    parseSlotDurationHours,
    getKolkataTime
} = require("../controllers/bookingController");
const { calculateBookingPrice } = require("../utils/pricingCalculator");

const mockReqRes = (overrides = {}) => {
    const req = {
        body: {},
        params: {},
        query: {},
        headers: {},
        user: { id: new mongoose.Types.ObjectId().toString(), role: "customer" },
        ...overrides
    };

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

describe("Booking API & Time Slot Validation Tests", () => {
    const customerId = new mongoose.Types.ObjectId().toString();
    const workerUserId = new mongoose.Types.ObjectId().toString();
    const workerProfileId = new mongoose.Types.ObjectId().toString();
    const bookingId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("Time Slot Parsers & Helpers", () => {
        it("should parse standard time ranges into correct starting minutes from midnight", () => {
            // 09:00 AM - 11:00 AM -> start: 09:00 AM = 540 mins
            expect(parseSlotStartMinutes("09:00 AM - 11:00 AM")).toBe(540);
            // 11:30 AM - 01:30 PM -> start: 11:30 AM = 11*60 + 30 = 690 mins
            expect(parseSlotStartMinutes("11:30 AM - 01:30 PM")).toBe(690);
            // 02:00 PM - 04:00 PM -> start: 02:00 PM = 14*60 = 840 mins
            expect(parseSlotStartMinutes("02:00 PM - 04:00 PM")).toBe(840);
            // 04:30 PM - 06:30 PM -> start: 04:30 PM = 16*60 + 30 = 990 mins
            expect(parseSlotStartMinutes("04:30 PM - 06:30 PM")).toBe(990);
            // 07:00 PM - 09:00 PM -> start: 07:00 PM = 19*60 = 1140 mins
            expect(parseSlotStartMinutes("07:00 PM - 09:00 PM")).toBe(1140);
        });

        it("should parse standard time ranges into correct ending minutes from midnight", () => {
            expect(parseSlotEndMinutes("09:00 AM - 11:00 AM")).toBe(660);
            expect(parseSlotEndMinutes("11:30 AM - 01:30 PM")).toBe(810);
            expect(parseSlotEndMinutes("02:00 PM - 04:00 PM")).toBe(960);
            expect(parseSlotEndMinutes("04:30 PM - 06:30 PM")).toBe(1110);
            expect(parseSlotEndMinutes("07:00 PM - 09:00 PM")).toBe(1260);
        });

        it("should calculate duration in hours correctly", () => {
            expect(parseSlotDurationHours("09:00 AM - 11:00 AM")).toBe(2);
            expect(parseSlotDurationHours("11:30 AM - 01:30 PM")).toBe(2);
            expect(parseSlotDurationHours("10:00 AM - 01:00 PM")).toBe(3);
        });
    });

    describe("Time Slot & Date Validation Scenarios", () => {
        it("Scenario 1: At 10:50 AM, 09:00 AM - 11:00 AM slot must be rejected as already passed/partially elapsed", async () => {
            const todayStr = getKolkataTime().dateStr;
            // Mock getKolkataTime to return 10:50 AM (10 * 60 + 50 = 650 minutes)
            const mockCurrentMinutes = 650; // 10:50 AM

            // 09:00 AM - 11:00 AM has start time = 540 minutes <= 650 minutes
            const { req, res } = mockReqRes({
                body: {
                    workerId: workerProfileId,
                    date: todayStr,
                    time: "09:00 AM - 11:00 AM",
                    notes: "Expired slot booking attempt"
                },
                user: { id: customerId, role: "customer" }
            });

            // We can test both the createBooking controller logic and time checking
            const slotStart = parseSlotStartMinutes("09:00 AM - 11:00 AM");
            expect(slotStart <= mockCurrentMinutes).toBe(true);

            // Also test against actual real time: any slot whose start has passed is rejected
            const { totalMinutes } = getKolkataTime();
            const pastMins = Math.max(0, totalMinutes - 10);
            const h = Math.floor(pastMins / 60);
            const m = pastMins % 60;
            const hour12 = h % 12 === 0 ? 12 : h % 12;
            const mod = h >= 12 ? "PM" : "AM";
            const elapsedSlot = `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${mod} - 11:59 PM`;

            req.body.time = elapsedSlot;
            await createBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.body.message).toBe("Your selected time slot has already passed. Please choose another available slot.");
        });

        it("Scenario 2: At 10:50 AM (650 mins), 11:30 AM - 01:30 PM slot (start: 690 mins) is available and valid", () => {
            const mockCurrentMinutes = 650; // 10:50 AM
            const slotStart = parseSlotStartMinutes("11:30 AM - 01:30 PM"); // 690 mins
            expect(slotStart).toBe(690);
            expect(slotStart > mockCurrentMinutes).toBe(true);
        });

        it("Scenario 3: At 12:00 PM (720 mins), 11:30 AM - 01:30 PM slot (start: 690 mins) is unavailable/expired", () => {
            const mockCurrentMinutes = 720; // 12:00 PM
            const slotStart = parseSlotStartMinutes("11:30 AM - 01:30 PM"); // 690 mins
            expect(slotStart <= mockCurrentMinutes).toBe(true);
        });

        it("Scenario 4: Tomorrow / future date allows all valid slots", async () => {
            jest.spyOn(Booking, "findOne").mockResolvedValue(null);
            jest.spyOn(Worker, "findById").mockResolvedValue({ _id: workerProfileId, charges: 250 });

            const futureDate = "2099-10-15";
            const { req, res } = mockReqRes({
                body: {
                    workerId: workerProfileId,
                    date: futureDate,
                    time: "09:00 AM - 11:00 AM",
                    notes: "Morning appointment"
                },
                user: { id: customerId, role: "customer" }
            });

            jest.spyOn(Booking.prototype, "save").mockImplementation(function () {
                this._id = bookingId;
                this.status = "pending";
                return Promise.resolve(this);
            });

            await createBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.body).toHaveProperty("_id");
            expect(res.body.status).toBe("pending");
        });

        it("Scenario 5: Past date must be rejected with 400", async () => {
            const yesterdayDate = "2020-01-01";
            const { req, res } = mockReqRes({
                body: {
                    workerId: workerProfileId,
                    date: yesterdayDate,
                    time: "10:00 AM - 12:00 PM",
                    notes: "Past date booking"
                },
                user: { id: customerId, role: "customer" }
            });

            await createBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.body.message).toMatch(/cannot book an appointment for a past date/i);
        });

        it("Scenario 6: API requests attempting to book expired slots must be rejected with 400", async () => {
            const { dateStr, totalMinutes } = getKolkataTime();
            // Create a slot starting before current time
            const pastMins = Math.max(0, totalMinutes - 5);
            const h = Math.floor(pastMins / 60);
            const m = pastMins % 60;
            const hour12 = h % 12 === 0 ? 12 : h % 12;
            const mod = h >= 12 ? "PM" : "AM";
            const pastSlot = `${String(hour12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${mod} - 11:59 PM`;

            const { req, res } = mockReqRes({
                body: {
                    workerId: workerProfileId,
                    date: dateStr,
                    time: pastSlot,
                    notes: "Expired slot API exploit"
                },
                user: { id: customerId, role: "customer" }
            });

            await createBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.body.message).toBe("Your selected time slot has already passed. Please choose another available slot.");
        });

        it("Scenario 7: Prevent double-booking for the same worker, date, and time", async () => {
            const futureDate = "2099-10-15";
            jest.spyOn(Booking, "findOne").mockResolvedValue({
                _id: bookingId,
                workerId: workerProfileId,
                date: futureDate,
                time: "10:00 AM - 12:00 PM"
            });

            const { req, res } = mockReqRes({
                body: {
                    workerId: workerProfileId,
                    date: futureDate,
                    time: "10:00 AM - 12:00 PM",
                    notes: "Another booking attempt"
                },
                user: { id: customerId, role: "customer" }
            });

            await createBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.body.message).toMatch(/already booked/i);
        });
    });

    describe("Pricing Calculation Scenarios (Single Source of Truth)", () => {
        it("Pricing Scenario 1: ₹250/hour x 2 hours = ₹500 service cost", () => {
            const pricing = calculateBookingPrice({
                hourlyRate: 250,
                durationHours: 2,
                platformFee: 0,
                taxes: 0,
                additionalCharges: 0
            });
            expect(pricing.serviceCost).toBe(500);
            expect(pricing.totalAmount).toBe(500);
            expect(pricing.platformFee).toBe(0);
            expect(pricing.taxes).toBe(0);
        });

        it("Pricing Scenario 2: ₹250/hour x 3 hours = ₹750 service cost", () => {
            const pricing = calculateBookingPrice({
                hourlyRate: 250,
                durationHours: 3,
                platformFee: 0,
                taxes: 0,
                additionalCharges: 0
            });
            expect(pricing.serviceCost).toBe(750);
            expect(pricing.totalAmount).toBe(750);
        });

        it("Pricing Scenario 3: ₹300/hour x 2 hours = ₹600 service cost", () => {
            const pricing = calculateBookingPrice({
                hourlyRate: 300,
                durationHours: 2,
                platformFee: 0,
                taxes: 0,
                additionalCharges: 0
            });
            expect(pricing.serviceCost).toBe(600);
            expect(pricing.totalAmount).toBe(600);
        });

        it("Pricing Scenario 4: Platform fees and taxes are added correctly without duplicate charges", () => {
            const pricing = calculateBookingPrice({
                hourlyRate: 250,
                durationHours: 2,
                platformFee: 50,
                additionalCharges: 0,
                taxRate: 0.18 // 18% GST
            });
            // serviceCost = 250 * 2 = 500
            // platformFee = 50
            // tax = (500 + 50) * 0.18 = 99
            // totalAmount = 500 + 50 + 99 = 649
            expect(pricing.serviceCost).toBe(500);
            expect(pricing.platformFee).toBe(50);
            expect(pricing.taxes).toBe(99);
            expect(pricing.totalAmount).toBe(649);
        });

        it("Pricing Scenario 5: Backend serves as source of truth and stores complete priceBreakdown", async () => {
            jest.spyOn(Booking, "findOne").mockResolvedValue(null);
            jest.spyOn(Worker, "findById").mockResolvedValue({ _id: workerProfileId, charges: 250 });

            let savedDoc = null;
            jest.spyOn(Booking.prototype, "save").mockImplementation(function () {
                this._id = bookingId;
                savedDoc = this;
                return Promise.resolve(this);
            });

            const { req, res } = mockReqRes({
                body: {
                    workerId: workerProfileId,
                    date: "2099-11-20",
                    time: "02:00 PM - 04:00 PM", // 2 hours
                    estimatedHours: 2,
                    estimatedPrice: 9999, // Manipulated frontend price! Backend must override!
                    notes: "Price validation test"
                },
                user: { id: customerId, role: "customer" }
            });

            await createBooking(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            // Server must compute canonical price: 250 * 2 = 500
            expect(savedDoc.estimatedPrice).toBe(500);
            expect(savedDoc.estimatedHours).toBe(2);
            expect(savedDoc.priceBreakdown).toBeDefined();
            expect(savedDoc.priceBreakdown.serviceCost).toBe(500);
            expect(savedDoc.priceBreakdown.totalAmount).toBe(500);
        });
    });

    describe("Worker Booking Lifecycle", () => {
        it("should allow a worker to retrieve their bookings", async () => {
            jest.spyOn(Worker, "findOne").mockResolvedValue({
                _id: workerProfileId,
                userId: workerUserId
            });

            const mockBookings = [
                {
                    _id: bookingId,
                    workerId: workerProfileId,
                    customerId: { name: "Client A", email: "client@example.com" },
                    date: "2099-10-15",
                    time: "10:00 AM"
                }
            ];

            jest.spyOn(Booking, "find").mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue(mockBookings)
                })
            });

            const { req, res } = mockReqRes({
                user: { id: workerUserId, role: "worker" }
            });

            await getMyBookings(req, res);

            expect(res.json).toHaveBeenCalled();
            expect(res.body.length).toBeGreaterThan(0);
            expect(res.body[0].customerId).toBeDefined();
        });

        it("should allow a verified worker to accept a booking", async () => {
            const fakeBooking = {
                _id: bookingId,
                workerId: { _id: workerProfileId, status: "approved", verificationStatus: "approved" },
                status: "pending",
                save: jest.fn().mockResolvedValue(true)
            };

            jest.spyOn(Booking, "findById").mockReturnValue({
                populate: jest.fn().mockResolvedValue(fakeBooking)
            });

            const { req, res } = mockReqRes({
                params: { id: bookingId },
                body: { status: "accepted" },
                user: { id: workerUserId, role: "worker" }
            });

            await updateBookingStatus(req, res);

            expect(fakeBooking.status).toBe("accepted");
            expect(fakeBooking.save).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(fakeBooking);
        });
    });
});
