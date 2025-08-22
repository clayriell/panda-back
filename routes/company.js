const express = require("express");
const { getAll, getList } = require("../controllers/company");
const { authenticate } = require("../middleware/auth");
const { mustRole } = require("../middleware/role");

const router = express.Router();

router.get("/", authenticate, mustRole("SYS_ADMIN"), getAll);
router.get("/list", getList);

module.exports = router;
