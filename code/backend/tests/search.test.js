// ServeConnect - Search & Ranking Logic Test Suite
// Author: Pratham Goyal (QA & Integration)

const mongoose = require("mongoose");
const Worker = require("../models/Worker");
const { searchWorkers } = require("../controllers/workerController");

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

describe("Customer Search & Ranking Logic API", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should return a list of approved workers", async () => {
        const fakeApprovedWorkers = [
            { _id: new mongoose.Types.ObjectId(), status: "approved", category: "Plumber", rating: 4.8 },
            { _id: new mongoose.Types.ObjectId(), status: "approved", category: "Electrician", rating: 4.5 }
        ];

        jest.spyOn(Worker, "find").mockImplementation((query) => {
            expect(query.status).toBe("approved");
            return {
                sort: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(fakeApprovedWorkers)
                })
            };
        });

        const { req, res } = mockReqRes({ query: {} });

        await searchWorkers(req, res);

        expect(res.json).toHaveBeenCalled();
        expect(Array.isArray(res.body.workers)).toBe(true);
        expect(res.body.workers.length).toBe(2);
    });

    it("should filter workers by category (e.g., Plumber)", async () => {
        const fakePlumbers = [
            { _id: new mongoose.Types.ObjectId(), status: "approved", category: "Plumber", rating: 4.9 }
        ];

        jest.spyOn(Worker, "find").mockImplementation((query) => {
            expect(query.category).toBeDefined();
            return {
                sort: jest.fn().mockReturnValue({
                    populate: jest.fn().mockResolvedValue(fakePlumbers)
                })
            };
        });

        const { req, res } = mockReqRes({ query: { category: "Plumber" } });

        await searchWorkers(req, res);

        expect(res.json).toHaveBeenCalled();
        expect(res.body.workers.length).toBe(1);
        expect(res.body.workers[0].category.toLowerCase()).toContain("plumber");
    });

    it("should sort workers by rating in descending order (Ranking Logic)", async () => {
        const fakeSortedWorkers = [
            { _id: new mongoose.Types.ObjectId(), status: "approved", category: "Plumber", rating: 4.9 },
            { _id: new mongoose.Types.ObjectId(), status: "approved", category: "Plumber", rating: 4.2 }
        ];

        jest.spyOn(Worker, "find").mockImplementation(() => ({
            sort: jest.fn().mockImplementation((sortObj) => {
                expect(sortObj.rating).toBe(-1); // Verify descending order
                return {
                    populate: jest.fn().mockResolvedValue(fakeSortedWorkers)
                };
            })
        }));

        const { req, res } = mockReqRes({ query: {} });

        await searchWorkers(req, res);

        expect(res.json).toHaveBeenCalled();
        expect(res.body.workers[0].rating).toBeGreaterThanOrEqual(res.body.workers[1].rating);
    });
});
