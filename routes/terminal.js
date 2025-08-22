const express = require("express");

const { getAll } = require("../controllers/terminal");
const { authenticate } = require("../middleware/auth");
const { mustRole } = require("../middleware/role");
const router = express.Router();

router.get("/", authenticate, mustRole("SYS_ADMIN", "ADMIN"), getAll);

module.exports = router;
