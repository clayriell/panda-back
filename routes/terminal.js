const express = require("express");
const {
  getAll,
  getList,
  detail,
  update,
  create,
} = require("../controllers/terminal");
const { authenticate } = require("../middleware/auth");
const { mustRole } = require("../middleware/role");
const router = express.Router();

router.get("/", authenticate, mustRole("SYS_ADMIN", "ADMIN"), getAll);
router.get("/list", getList);
router.get("/:id/detail", authenticate, mustRole("SYS_ADMIN"), detail);
router.put("/:id/update", authenticate, mustRole("SYS_ADMIN"), update);
router.post("/", authenticate, mustRole("SYS_ADMIN"), create);
module.exports = router;
