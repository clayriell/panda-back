const express = require("express");
const { authenticate } = require("../middleware/auth");
const { mustRole } = require("../middleware/role");
const { getAll } = require("../controllers/tug-service");
const { detail } = require("../controllers/pilotage-service");

const router = express.Router();

router.get("/", authenticate, mustRole("SYS_ADMIN"), getAll);
router.get("/:id/detail", authenticate, detail);

module.exports = router;
