const express = require("express");
const {
  getAll,
  getRequestedServices,
  request,
  approve,
  reject,
  detail,
  onBoard,
  offBoard,
  submit,
  getByCompany,
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
router.get("/company", authenticate, getByCompany);
router.get("/:id/detail", authenticate, detail);
router.post("/request", authenticate, request);
router.put("/:id/approve", authenticate, mustRole("ADMIN"), approve);
router.put("/:id/reject", authenticate, mustRole("ADMIN"), reject);
router.put("/:id/onBoard", authenticate, mustRole("PILOT"), onBoard);
router.put("/:id/offBoard", authenticate, mustRole("PILOT"), offBoard);
router.put("/:id/submit", authenticate, mustRole("PILOT"), submit);

module.exports = router;
