const Worker = require("../models/Worker");
const User = require("../models/User");

const registerWorkerProfile = async (req, res) => {
    try {
        const { phone, category, experience, charges, location } = req.body;

        const existingProfile = await Worker.findOne({ userId: req.user._id });
        if (existingProfile) {
            return res.status(400).json({ message: "Worker profile already exists" });
        }

        const workerProfile = await Worker.create({
            userId: req.user._id,
            phone,
            category,
            experience,
            charges,
            location,
            status: "pending"
        });

        res.status(201).json(workerProfile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getWorkerById = async (req, res) => {
    try {
        const worker = await Worker.findById(req.params.id).populate('userId', 'name email');
        
        if (!worker) {
            return res.status(404).json({ message: "Worker not found" });
        }

        if (worker.status !== 'approved') {
            worker.phone = undefined;
        }

        res.json(worker);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const searchWorkers = async (req, res) => {
    try {
        const { category, location } = req.query;
        let query = { status: 'approved' }; // Only show approved workers
        
        if (category) query.category = new RegExp(category, 'i');
        if (location) query.location = new RegExp(location, 'i');

        // Week 5: Ranking Logic - Sort by rating descending
        const workers = await Worker.find(query)
            .sort({ rating: -1 })
            .populate('userId', 'name email');
            
        res.json(workers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerWorkerProfile, getWorkerById, searchWorkers };

