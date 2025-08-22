const express = require("express");
const { getAll } = require("../controllers/agency");
const { authenticate } = require("../middleware/auth");
const { mustRole } = require("../middleware/role");

const router = express.Router();

router.get("/", authenticate, mustRole("ADMIN", "SYS_ADMIN"), getAll);

module.exports = router;
