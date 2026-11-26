// ServeConnect — End-to-End Unified Login & Role Detection Test Suite
// Verifies unified login for Admin, Customer, and Worker, role routing verification,
// RBAC enforcement, and public admin registration prevention.

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { loginUser, registerUser } = require("../controllers/authController");
const { protect, authorize } = require("../middleware/authMiddleware");

jest.setTimeout(15000);

const mockReqRes = (overrides = {}) => {
    const req = {
        body: {},
        params: {},
        query: {},
        headers: {},
        user: null,
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

describe("Unified Login & Role-Based Access Control Tests", () => {
    const adminId = new mongoose.Types.ObjectId();
    const workerId = new mongoose.Types.ObjectId();
    const customerId = new mongoose.Types.ObjectId();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("1. Unified Login with Automatic Role Detection", () => {
        it("should authenticate Admin with admin@serveconnect.com / admin123 and detect admin role", async () => {
            const hashedPassword = await bcrypt.hash("admin123", 10);

            jest.spyOn(User, "findOne").mockResolvedValue({
                _id: adminId,
                name: "System Administrator",
                email: "admin@serveconnect.com",
                password: hashedPassword,
                role: "admin",
            });

            const { req, res } = mockReqRes({
                body: { email: "admin@serveconnect.com", password: "admin123" }
            });

            await loginUser(req, res);

            expect(res.json).toHaveBeenCalled();
            expect(res.body).toHaveProperty("token");
            expect(res.body.role).toBe("admin");
            expect(res.body.email).toBe("admin@serveconnect.com");
        });

        it("should authenticate Worker and detect worker role for dashboard routing", async () => {
            const hashedPassword = await bcrypt.hash("worker123", 10);

            jest.spyOn(User, "findOne").mockResolvedValue({
                _id: workerId,
                name: "Certified Plumber",
                email: "worker@serveconnect.com",
                password: hashedPassword,
                role: "worker",
            });

            const { req, res } = mockReqRes({
                body: { email: "worker@serveconnect.com", password: "worker123" }
            });

            await loginUser(req, res);

            expect(res.json).toHaveBeenCalled();
            expect(res.body).toHaveProperty("token");
            expect(res.body.role).toBe("worker");
        });

        it("should authenticate Customer and detect customer role for marketplace routing", async () => {
            const hashedPassword = await bcrypt.hash("customer123", 10);

            jest.spyOn(User, "findOne").mockResolvedValue({
                _id: customerId,
                name: "Homeowner",
                email: "customer@serveconnect.com",
                password: hashedPassword,
                role: "customer",
            });

            const { req, res } = mockReqRes({
                body: { email: "customer@serveconnect.com", password: "customer123" }
            });

            await loginUser(req, res);

            expect(res.json).toHaveBeenCalled();
            expect(res.body).toHaveProperty("token");
            expect(res.body.role).toBe("customer");
        });

        it("should reject invalid password with 401 and an error message", async () => {
            const hashedPassword = await bcrypt.hash("admin123", 10);

            jest.spyOn(User, "findOne").mockResolvedValue({
                _id: adminId,
                name: "Admin",
                email: "admin@serveconnect.com",
                password: hashedPassword,
                role: "admin",
            });

            const { req, res } = mockReqRes({
                body: { email: "admin@serveconnect.com", password: "wrongpassword" }
            });

            await loginUser(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.body.message).toMatch(/invalid email or password/i);
        });

        it("should reject nonexistent user with 401", async () => {
            jest.spyOn(User, "findOne").mockResolvedValue(null);

            const { req, res } = mockReqRes({
                body: { email: "unknown@serveconnect.com", password: "password" }
            });

            await loginUser(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.body.message).toMatch(/invalid email or password/i);
        });
    });

    describe("2. RBAC Route Guard Protection", () => {
        it("should deny Customer access to Admin-only routes with 403 Forbidden", () => {
            const { req, res } = mockReqRes({
                user: { _id: customerId, role: "customer" }
            });
            const next = jest.fn();

            const adminGuard = authorize("admin");
            adminGuard(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.body.message).toMatch(/not authorized/i);
            expect(next).not.toHaveBeenCalled();
        });

        it("should deny Worker access to Admin-only routes with 403 Forbidden", () => {
            const { req, res } = mockReqRes({
                user: { _id: workerId, role: "worker" }
            });
            const next = jest.fn();

            const adminGuard = authorize("admin");
            adminGuard(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.body.message).toMatch(/not authorized/i);
            expect(next).not.toHaveBeenCalled();
        });

        it("should allow Admin access to Admin routes", () => {
            const { req, res } = mockReqRes({
                user: { _id: adminId, role: "admin" }
            });
            const next = jest.fn();

            const adminGuard = authorize("admin");
            adminGuard(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it("should block unauthenticated requests without authorization header with 401", async () => {
            const { req, res } = mockReqRes({ headers: {} });
            const next = jest.fn();

            await protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe("3. Registration Security & Non-Admin Guarantee", () => {
        it("should prevent public users from creating admin accounts", async () => {
            jest.spyOn(User, "findOne").mockResolvedValue(null);
            const createSpy = jest.spyOn(User, "create").mockResolvedValue({
                _id: new mongoose.Types.ObjectId(),
                name: "Malicious User",
                email: "fakeadmin@serveconnect.com",
                role: "customer"
            });

            const { req, res } = mockReqRes({
                body: {
                    name: "Malicious User",
                    email: "fakeadmin@serveconnect.com",
                    password: "password123",
                    role: "admin"
                }
            });

            await registerUser(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
                role: "customer"
            }));
            expect(res.body.role).toBe("customer");
        });
    });
});
