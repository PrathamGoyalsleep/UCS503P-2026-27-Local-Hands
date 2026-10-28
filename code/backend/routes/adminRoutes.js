const express = require("express");
const router = express.Router();
const {
    getAdminStats,
    getAllWorkers,
    getWorkerDetails,
    approveWorker,
    rejectWorker
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/authMiddleware");

// All admin routes are protected and strictly restricted to the 'admin' role
router.use(protect, authorize("admin"));

router.get("/stats", getAdminStats);
router.get("/workers", getAllWorkers);
router.get("/workers/:id", getWorkerDetails);
router.put("/workers/:id/approve", approveWorker);
router.put("/workers/:id/reject", rejectWorker);

module.exports = router;
