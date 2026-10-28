const Worker = require("../models/Worker");
const User = require("../models/User");
const Review = require("../models/Review");
const { sendWorkerApprovalEmail, sendWorkerRejectionEmail } = require("../utils/emailService");

// GET /api/admin/stats
const getAdminStats = async (req, res) => {
    try {
        const total = await Worker.countDocuments();
        const pending = await Worker.countDocuments({ status: "pending" });
        const approved = await Worker.countDocuments({ status: "approved" });
        const rejected = await Worker.countDocuments({ status: "rejected" });

        res.json({ total, pending, approved, rejected });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/admin/workers
// Query params: status (pending|approved|rejected|all), search, category, location
// Default sort: createdAt: -1 (Newest applications first)
const getAllWorkers = async (req, res) => {
    try {
        const { status, search, category, location, sort } = req.query;
        let query = {};

        // Status filtering (default is all if not specified, but pending can be requested)
        if (status && status !== "all") {
            query.status = status;
        }

        // Category filter
        if (category && category !== "all") {
            query.category = new RegExp(category, "i");
        }

        // Location filter
        if (location) {
            query.location = new RegExp(location, "i");
        }

        // Sort: default newest first
        let sortOption = { createdAt: -1 };
        if (sort === "oldest") {
            sortOption = { createdAt: 1 };
        } else if (sort === "charges_high") {
            sortOption = { charges: -1 };
        } else if (sort === "charges_low") {
            sortOption = { charges: 1 };
        }

        let workers = await Worker.find(query)
            .sort(sortOption)
            .populate("userId", "name email phone")
            .populate("reviewedBy", "name email");

        // Search by worker name or email in memory if search query provided
        if (search && search.trim()) {
            const term = search.trim().toLowerCase();
            workers = workers.filter((w) => {
                const name = w.userId?.name?.toLowerCase() || "";
                const email = w.userId?.email?.toLowerCase() || "";
                const loc = w.location?.toLowerCase() || "";
                const cat = w.category?.toLowerCase() || "";
                const phone = (w.phone || w.userId?.phone || "").toLowerCase();
                return (
                    name.includes(term) ||
                    email.includes(term) ||
                    loc.includes(term) ||
                    cat.includes(term) ||
                    phone.includes(term)
                );
            });
        }

        res.json(workers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/admin/workers/:id
const getWorkerDetails = async (req, res) => {
    try {
        const worker = await Worker.findById(req.params.id)
            .populate("userId", "name email phone")
            .populate("reviewedBy", "name email");

        if (!worker) {
            return res.status(404).json({ message: "Worker application not found" });
        }

        // Fetch genuine customer reviews from database
        const dbReviews = await Review.find({ workerId: worker._id })
            .populate("customerId", "name email")
            .sort({ createdAt: -1 })
            .limit(10);

        const formattedReviews = dbReviews.map((r) => ({
            _id: r._id,
            name: r.customerId?.name || "Customer",
            email: r.customerId?.email || "",
            rating: r.rating,
            comment: r.comment,
            date: new Date(r.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }),
            createdAt: r.createdAt
        }));

        const result = worker.toObject();
        result.reviews = formattedReviews;
        result.realReviewsCount = formattedReviews.length;

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/admin/workers/:id/approve
const approveWorker = async (req, res) => {
    try {
        const worker = await Worker.findById(req.params.id);
        if (!worker) {
            return res.status(404).json({ message: "Worker application not found" });
        }

        worker.status = "approved";
        worker.reviewedAt = new Date();
        worker.reviewedBy = req.user?._id;
        worker.rejectionReason = "";

        await worker.save();

        const populated = await Worker.findById(worker._id)
            .populate("userId", "name email phone")
            .populate("reviewedBy", "name email");

        // Automatically trigger professional approval email notification
        try {
            await sendWorkerApprovalEmail(populated);
        } catch (emailErr) {
            console.error("[Email] Notice: Failed to deliver email notification:", emailErr.message);
        }

        res.json({
            message: "Worker application approved successfully",
            worker: populated
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/admin/workers/:id/reject
const rejectWorker = async (req, res) => {
    try {
        const { reason } = req.body;
        const worker = await Worker.findById(req.params.id);
        if (!worker) {
            return res.status(404).json({ message: "Worker application not found" });
        }

        worker.status = "rejected";
        worker.rejectionReason = reason?.trim() || "Application qualifications do not meet current marketplace criteria.";
        worker.reviewedAt = new Date();
        worker.reviewedBy = req.user?._id;

        await worker.save();

        const populated = await Worker.findById(worker._id)
            .populate("userId", "name email phone")
            .populate("reviewedBy", "name email");

        // Automatically dispatch rejection email notification with admin reason
        try {
            await sendWorkerRejectionEmail(populated, worker.rejectionReason);
        } catch (emailErr) {
            console.error("[Email] Notice: Failed to deliver rejection email notification:", emailErr.message);
        }

        res.json({
            message: "Worker application rejected",
            worker: populated
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAdminStats,
    getAllWorkers,
    getWorkerDetails,
    approveWorker,
    rejectWorker
};
