const express = require("express");
const { authenticate } = require("../middleware/auth");
const { mustRole } = require("../middleware/role");
const { getAll, detail, getByCompany , getService} = require("../controllers/tug-service");

const router = express.Router();

router.get("/sys-all", authenticate, mustRole("SYS_ADMIN"), getAll);
router.get("/all", authenticate, getService);
router.get("/:id/detail", authenticate, detail);
router.get("/company", authenticate, getByCompany);

module.exports = router;
