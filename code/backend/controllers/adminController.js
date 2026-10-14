const Worker = require("../models/Worker");
const { sendWorkerApprovalEmail } = require("../utils/emailService");

// GET /api/admin/workers
const getAllWorkers = async (req, res) => {
    try {
        const workers = await Worker.find().populate('userId', 'name email');
        res.json(workers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/admin/workers/:id/approve
const approveWorker = async (req, res) => {
    try {
        const worker = await Worker.findByIdAndUpdate(
            req.params.id,
            { status: "approved" },
            { new: true }
        ).populate('userId', 'name email');
        
        if (!worker) return res.status(404).json({ message: "Worker not found" });

        // Automatically generate and send approval email to the worker
        await sendWorkerApprovalEmail(worker);

        res.json(worker);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PUT /api/admin/workers/:id/reject
const rejectWorker = async (req, res) => {
    try {
        const worker = await Worker.findByIdAndUpdate(
            req.params.id,
            { status: "rejected" },
            { new: true }
        );
        if (!worker) return res.status(404).json({ message: "Worker not found" });
        res.json(worker);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAllWorkers, approveWorker, rejectWorker };

