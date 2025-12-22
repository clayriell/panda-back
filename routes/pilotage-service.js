const express = require("express");
const {
  getAll,
  create,
  approve,
  reject,
  getDetail,
  onBoard,
  offBoard,
  submit,
  register,
} = require("../controllers/pilotage-service");

const { authenticate } = require("../middleware/auth");
const { mustRole } = require("../middleware/role");
const router = express.Router();

router.get(
  "/",
  authenticate,
  mustRole("SYS_ADMIN", "ADMIN", "MANAGER"),
  getAll
);
router.get("/:id", authenticate, getDetail);
router.put("/:id/approve", authenticate, mustRole("ADMIN"), approve);
router.put("/:id/reject", authenticate, mustRole("ADMIN"), reject);
router.put("/:id/onBoard", authenticate, mustRole("PILOT"), onBoard);
router.put("/:id/offBoard", authenticate, mustRole("PILOT"), offBoard);
router.put("/:id/register", authenticate, mustRole("ADMIN"), register);
router.put("/:id/submit", authenticate, mustRole("ADMIN"), submit);
router.post("/request", authenticate, create);

module.exports = router;
