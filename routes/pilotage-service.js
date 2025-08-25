const express = require("express");
const {
  getAll,
  getRequestedServices,
  request,
} = require("../controllers/pilotage-service");

const { authenticate } = require("../middleware/auth");
const { mustRole } = require("../middleware/role");
const router = express.Router();

// GET /api/service/requested
router.get("/", getAll);
router.get(
  "/request",
  authenticate,
  mustRole("ADMIN", "SYS_ADMIN"),
  getRequestedServices
);
router.post("/request", authenticate, request);

module.exports = router;
