const express = require("express");
const {
  getAll,
  getRequestedServices,
  request,
  approve,
  reject,
  detail,
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
router.get("/:id/detail", authenticate, detail);
router.post("/request", authenticate, request);
router.put("/:id/approve", authenticate, mustRole("ADMIN"), approve);
router.put("/:id/reject", authenticate, mustRole("ADMIN"), reject);

module.exports = router;
