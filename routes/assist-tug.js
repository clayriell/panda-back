const express = require("express");
const { getAll, getList, getAssistTug, getDetail, getByTugMaster } = require("../controllers/assist-tug");
const { authenticate } = require("../middleware/auth");
const { mustRole } = require("../middleware/role");
const router = express.Router();

router.get("/sys-all", authenticate, mustRole("SYS_ADMIN"), getAll);
router.get("/all", authenticate, mustRole("ADMIN"), getAssistTug);
router.get("/master-tug", authenticate, mustRole("TUG_MASTER"), getByTugMaster);
router.get("/:id/detail", authenticate, getDetail);
router.get("/list", getList);
// router.get("/company", authenticate, getByCompany);

module.exports = router;
