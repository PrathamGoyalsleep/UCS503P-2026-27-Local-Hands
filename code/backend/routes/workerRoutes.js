const express = require("express");
const router = express.Router();
const { registerWorkerProfile, getWorkerById, searchWorkers } = require("../controllers/workerController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, authorize("worker"), registerWorkerProfile);
router.get("/", searchWorkers);
router.get("/:id", getWorkerById);

module.exports = router;

