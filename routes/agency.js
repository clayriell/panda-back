const express = require("express");
const {
  getAll,
  getList,
  detail,
  create,
  update,
} = require("../controllers/agency");
const { authenticate } = require("../middleware/auth");
const { mustRole } = require("../middleware/role");

const router = express.Router();

router.get("/", authenticate, mustRole("ADMIN", "SYS_ADMIN"), getAll);
router.get("/list", getList);
router.get("/:id/detail", authenticate, mustRole("SYS_ADMIN"), detail);
router.post("/", authenticate, mustRole("SYS_ADMIN"), create);
router.put("/:id/update", authenticate, mustRole("SYS_ADMIN"), update);
module.exports = router;
