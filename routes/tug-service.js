const express = require("express");
const { authenticate } = require("../middleware/auth");
const { mustRole } = require("../middleware/role");
const { getAll, detail, getByCompany , getService, getServiceByTug, assistMob} = require("../controllers/tug-service");

const router = express.Router();

router.get("/", authenticate, mustRole("TUG_MASTER"), getServiceByTug);
router.get("/sys-all", authenticate, mustRole("SYS_ADMIN"), getAll);
router.get("/all", authenticate, getService);
router.get("/:id/detail", authenticate, detail);
router.get("/company", authenticate, getByCompany);
router.put("/:id/mob", authenticate, mustRole("TUG_MASTER"), assistMob);

module.exports = router;
