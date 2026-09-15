const request = require("supertest");
const app = require("../server");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Worker = require("../models/Worker");

let customerToken, workerToken, workerProfileId;

beforeAll(async () => {
    // Connect to test DB
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/serveconnect_test", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    
    // Clean up
    await User.deleteMany({});
    await Worker.deleteMany({});
    await Booking.deleteMany({});

    // Create Customer
    const customerRes = await request(app).post("/api/auth/register").send({
        name: "Test Customer",
        email: "customer@test.com",
        password: "password123",
        role: "customer"
    });
    customerToken = customerRes.body.token;

    // Create Worker
    const workerRes = await request(app).post("/api/auth/register").send({
        name: "Test Worker",
        email: "worker@test.com",
        password: "password123",
        role: "worker"
    });
    workerToken = workerRes.body.token;

    // Create Worker Profile
    const profileRes = await request(app)
        .post("/api/workers")
        .set("Authorization", `Bearer ${workerToken}`)
        .send({
            category: "Plumber",
            experience: 5,
            charges: 300,
            location: "Delhi",
            phone: "9999999999"
        });
    workerProfileId = profileRes.body._id;
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe("Booking API Tests (Week 6)", () => {
    let bookingId;

    it("should allow a customer to create a booking", async () => {
        const res = await request(app)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${customerToken}`)
            .send({
                workerId: workerProfileId,
                date: "2026-10-15",
                time: "10:00 AM",
                notes: "Fix the sink"
            });
        
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("_id");
        expect(res.body.status).toBe("pending");
        bookingId = res.body._id;
    });

    it("should prevent double-booking for the same worker, date, and time", async () => {
        const res = await request(app)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${customerToken}`)
            .send({
                workerId: workerProfileId,
                date: "2026-10-15",
                time: "10:00 AM",
                notes: "Another booking attempt"
            });
        
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/already booked/i);
    });

    it("should allow a worker to retrieve their bookings", async () => {
        const res = await request(app)
            .get("/api/bookings/my-bookings")
            .set("Authorization", `Bearer ${workerToken}`);
        
        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0].customerId).toBeDefined();
    });

    it("should allow a worker to accept a booking", async () => {
        const res = await request(app)
            .put(`/api/bookings/${bookingId}/status`)
            .set("Authorization", `Bearer ${workerToken}`)
            .send({ status: "accepted" });
        
        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe("accepted");
    });
});

