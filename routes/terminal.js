const express = require("express");

const { getAll, getList } = require("../controllers/terminal");
const { authenticate } = require("../middleware/auth");
const { mustRole } = require("../middleware/role");
const router = express.Router();

router.get("/", authenticate, mustRole("SYS_ADMIN", "ADMIN"), getAll);
router.get("/list", getList);

module.exports = router;
