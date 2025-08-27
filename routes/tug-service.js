const express = require("express");
const { authenticate } = require("../middleware/auth");
const { mustRole } = require("../middleware/role");
const { getAll, detail, getByCompany } = require("../controllers/tug-service");

const router = express.Router();

router.get("/", authenticate, mustRole("SYS_ADMIN"), getAll);
router.get("/:id/detail", authenticate, detail);
router.get("/company", authenticate, getByCompany);

module.exports = router;
