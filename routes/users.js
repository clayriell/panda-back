const express = require("express");
const {
  register,
  getAll,
  activate,
  deactivate,
} = require("../controllers/user");
const { authenticate } = require("../middleware/auth");
const { mustRole } = require("../middleware/role");
const router = express.Router();

// Endpoint login
router.post("/register", register);
router.get("/", authenticate, mustRole("SYS_ADMIN"), getAll);
router.put("/:id/activate", authenticate, mustRole("SYS_ADMIN"), activate);
router.put("/:id/deactivate", authenticate, mustRole("SYS_ADMIN"), deactivate);

module.exports = router;
