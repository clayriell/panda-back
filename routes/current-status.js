const express = require("express");
const { getAll } = require("../controllers/current-status");
const { authenticate } = require("../middleware/auth");
const { mustRole } = require("../middleware/role");

const router = express.Router();

router.get(
  "/",
  authenticate,
  mustRole("SYS_ADMIN", "ADMIN", "MANAGER"),
  getAll
);

module.exports = router;
