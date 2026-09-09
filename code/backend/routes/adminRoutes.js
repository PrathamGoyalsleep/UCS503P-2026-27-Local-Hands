const express = require("express");
const router = express.Router();
const { getAllWorkers, approveWorker, rejectWorker } = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/authMiddleware");

// All admin routes are protected and restricted to 'admin' role
router.use(protect, authorize("admin"));

router.get("/workers", getAllWorkers);
router.put("/workers/:id/approve", approveWorker);
router.put("/workers/:id/reject", rejectWorker);

module.exports = router;

