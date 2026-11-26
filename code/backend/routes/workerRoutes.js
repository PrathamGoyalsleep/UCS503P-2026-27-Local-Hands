const express = require("express");
const router = express.Router();
const {
  registerWorkerProfile,
  getWorkerById,
  searchWorkers,
  getServiceAreas,
  uploadWorkerProfileImage,
  uploadWorkerDocument
} = require("../controllers/workerController");
const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.post("/", protect, authorize("worker"), registerWorkerProfile);
router.post("/upload-profile-image", protect, authorize("worker"), upload.single("image"), uploadWorkerProfileImage);
router.post("/upload-document", protect, authorize("worker"), upload.single("document"), uploadWorkerDocument);
router.get("/", searchWorkers);
router.get("/service-areas", getServiceAreas);
router.get("/:id", getWorkerById);

module.exports = router;
