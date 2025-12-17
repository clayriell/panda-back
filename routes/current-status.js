const express = require("express");
const { getAll } = require("../controllers/current-status");
const { authenticate } = require("../middleware/auth");
const { mustRole } = require("../middleware/role");

const router = express.Router();

router.get("/", authenticate, mustRole("SYS_ADMIN"), getAll);

module.exports = router;
