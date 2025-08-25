const express = require("express");
const { authenticate } = require("../middleware/auth");
const { mustRole } = require("../middleware/role");
const { getAll } = require("../controllers/tug-service");

const router = express.Router();

router.get("/", authenticate, mustRole("SYS_ADMIN"), getAll);

module.exports = router;
