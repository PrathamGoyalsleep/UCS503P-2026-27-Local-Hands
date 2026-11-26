// ServeConnect - Authentication & RBAC Test Suite
// Author: Pratham (QA & Integration) & Vijay (Backend Lead)

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { registerUser, loginUser, uploadCustomerProfileImage, getMe } = require("../controllers/authController");
const { protect, authorize } = require("../middleware/authMiddleware");

process.env.JWT_SECRET = "serveconnect_test_jwt_secret_key";

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

describe("Authentication & RBAC Security Tests", () => {
    const userId = new mongoose.Types.ObjectId();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("User Registration", () => {
        it("should successfully register a new customer and return JWT", async () => {
            jest.spyOn(User, "findOne").mockResolvedValue(null);
            jest.spyOn(User, "create").mockResolvedValue({
                _id: userId,
                name: "Test Customer",
                email: "customer@test.com",
                role: "customer"
            });

            const { req, res } = mockReqRes({
                body: {
                    name: "Test Customer",
                    email: "customer@test.com",
                    password: "password123",
                    role: "customer"
                }
            });

            await registerUser(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.body).toHaveProperty("token");
            expect(res.body.role).toBe("customer");
            expect(res.body.email).toBe("customer@test.com");
        });

        it("should reject registration for an existing email with 400", async () => {
            jest.spyOn(User, "findOne").mockResolvedValue({
                _id: userId,
                email: "customer@test.com"
            });

            const { req, res } = mockReqRes({
                body: {
                    name: "Duplicate",
                    email: "customer@test.com",
                    password: "password123"
                }
            });

            await registerUser(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.body.message).toBe("User already exists");
        });

        it("should prevent public self-registration as admin and force role to customer", async () => {
            jest.spyOn(User, "findOne").mockResolvedValue(null);
            const createSpy = jest.spyOn(User, "create").mockResolvedValue({
                _id: userId,
                name: "Attacker",
                email: "attacker@test.com",
                role: "customer"
            });

            const { req, res } = mockReqRes({
                body: {
                    name: "Attacker",
                    email: "attacker@test.com",
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

    describe("User Login", () => {
        it("should login an admin and return a valid JWT", async () => {
            const hashedPassword = await bcrypt.hash("adminpassword", 10);

            jest.spyOn(User, "findOne").mockResolvedValue({
                _id: userId,
                name: "Admin User",
                email: "admin@test.com",
                password: hashedPassword,
                role: "admin"
            });

            const { req, res } = mockReqRes({
                body: {
                    email: "admin@test.com",
                    password: "adminpassword"
                }
            });

            await loginUser(req, res);

            expect(res.json).toHaveBeenCalled();
            expect(res.body).toHaveProperty("token");
            expect(res.body.role).toBe("admin");
        });

        it("should login a worker and return a valid JWT with role worker", async () => {
            const hashedPassword = await bcrypt.hash("workerpassword", 10);

            jest.spyOn(User, "findOne").mockResolvedValue({
                _id: userId,
                name: "Worker User",
                email: "worker@test.com",
                password: hashedPassword,
                role: "worker"
            });

            const { req, res } = mockReqRes({
                body: {
                    email: "worker@test.com",
                    password: "workerpassword"
                }
            });

            await loginUser(req, res);

            expect(res.json).toHaveBeenCalled();
            expect(res.body).toHaveProperty("token");
            expect(res.body.role).toBe("worker");
        });

        it("should login a customer and return a valid JWT with role customer", async () => {
            const hashedPassword = await bcrypt.hash("customerpassword", 10);

            jest.spyOn(User, "findOne").mockResolvedValue({
                _id: userId,
                name: "Customer User",
                email: "customer@test.com",
                password: hashedPassword,
                role: "customer"
            });

            const { req, res } = mockReqRes({
                body: {
                    email: "customer@test.com",
                    password: "customerpassword"
                }
            });

            await loginUser(req, res);

            expect(res.json).toHaveBeenCalled();
            expect(res.body).toHaveProperty("token");
            expect(res.body.role).toBe("customer");
        });

        it("should reject login with incorrect password with 401", async () => {
            const hashedPassword = await bcrypt.hash("correct_password", 10);

            jest.spyOn(User, "findOne").mockResolvedValue({
                _id: userId,
                email: "user@test.com",
                password: hashedPassword
            });

            const { req, res } = mockReqRes({
                body: {
                    email: "user@test.com",
                    password: "wrong_password"
                }
            });

            await loginUser(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.body.message).toBe("Invalid email or password");
        });
    });

    describe("Authentication & RBAC Middleware", () => {
        it("should reject protected route requests when authorization header is missing with 401", async () => {
            const { req, res } = mockReqRes({
                headers: {}
            });
            const next = jest.fn();

            await protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(next).not.toHaveBeenCalled();
        });

        it("should reject access when user role is not authorized with 403", () => {
            const { req, res } = mockReqRes({
                user: { role: "customer" }
            });
            const next = jest.fn();

            const roleMiddleware = authorize("admin");
            roleMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });

        it("should permit access when user has the authorized role", () => {
            const { req, res } = mockReqRes({
                user: { role: "admin" }
            });
            const next = jest.fn();

            const roleMiddleware = authorize("admin");
            roleMiddleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });

    describe("Customer Profile Image Upload (Cloudinary)", () => {
        it("should return 400 if no file is provided", async () => {
            const { req, res } = mockReqRes({
                file: null,
                user: { _id: userId, role: "customer" }
            });

            await uploadCustomerProfileImage(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.body.message).toMatch(/no image file/i);
        });

        it("should return 400 if uploaded file is not an image", async () => {
            const { req, res } = mockReqRes({
                file: { buffer: Buffer.from("pdf-data"), mimetype: "application/pdf" },
                user: { _id: userId, role: "customer" }
            });

            await uploadCustomerProfileImage(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.body.message).toMatch(/only image files/i);
        });

        it("should successfully upload customer avatar and save Cloudinary URL", async () => {
            const fakeUser = {
                _id: userId,
                name: "Customer",
                email: "customer@test.com",
                role: "customer",
                profileImage: "",
                profileImagePublicId: "",
                save: jest.fn().mockResolvedValue(true)
            };

            jest.spyOn(User, "findById").mockResolvedValue(fakeUser);

            const { req, res } = mockReqRes({
                file: { buffer: Buffer.from("fake-avatar-bytes"), mimetype: "image/png" },
                user: { _id: userId, role: "customer" }
            });

            await uploadCustomerProfileImage(req, res);

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: "Profile image uploaded successfully"
            }));
            expect(fakeUser.profileImage).toMatch(/cloudinary/i);
            expect(fakeUser.save).toHaveBeenCalled();
        });
    });

    describe("Current User Session (GET /api/auth/me)", () => {
        it("should return the authenticated user's profile based on verified token context", async () => {
            const fakeUser = {
                _id: userId,
                name: "Customer Verified",
                email: "customer@verified.com",
                role: "customer",
                profileImage: "https://example.com/avatar.jpg"
            };

            jest.spyOn(User, "findById").mockReturnValue({
                select: jest.fn().mockResolvedValue(fakeUser)
            });

            const { req, res } = mockReqRes({
                user: { _id: userId }
            });

            await getMe(req, res);

            expect(res.json).toHaveBeenCalledWith({
                _id: userId,
                name: "Customer Verified",
                email: "customer@verified.com",
                role: "customer",
                profileImage: "https://example.com/avatar.jpg"
            });
        });

        it("should return 404 if user record does not exist in database", async () => {
            jest.spyOn(User, "findById").mockReturnValue({
                select: jest.fn().mockResolvedValue(null)
            });

            const { req, res } = mockReqRes({
                user: { _id: userId }
            });

            await getMe(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.body.message).toMatch(/user not found/i);
        });
    });
});
