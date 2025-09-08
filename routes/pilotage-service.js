const express = require("express");
const {
  getAll,
  getRequestedServices,
  create,
  approve,
  reject,
  getDetail,
  onBoard,
  offBoard,
  submit,
  getRequestedServicebByCompany,
  getService,
} = require("../controllers/pilotage-service");

const { authenticate } = require("../middleware/auth");
const { mustRole } = require("../middleware/role");
const router = express.Router();

router.get("/sys-all", authenticate, mustRole("SYS_ADMIN"), getAll); // get all services by sys admin
router.get("/sys-requested", authenticate, mustRole("SYS_ADMIN"), getRequestedServices);
router.get("/all",authenticate, getService);
router.get("/requested", authenticate, getRequestedServicebByCompany);
router.get("/:id/detail", authenticate, getDetail);
router.put("/:id/approve", authenticate, mustRole("ADMIN"), approve);
router.put("/:id/reject", authenticate, mustRole("ADMIN"), reject);
router.put("/:id/onBoard", authenticate, mustRole("PILOT"), onBoard);
router.put("/:id/offBoard", authenticate, mustRole("PILOT"), offBoard);
router.put("/:id/submit", authenticate, mustRole("PILOT"), submit);
router.post("/request", authenticate, create);

module.exports = router;
