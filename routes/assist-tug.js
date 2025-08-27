const express = require("express");
const { getAll, getList, getByCompany } = require("../controllers/assist-tug");
const { authenticate } = require("../middleware/auth");
const { mustRole } = require("../middleware/role");
const router = express.Router();

router.get("/", authenticate, mustRole("ADMIN", "SYS_ADMIN"), getAll);
router.get("/list", getList);
router.get("/services", authenticate, getByCompany);

module.exports = router;
