const express = require("express");
const { authenticate } = require("../middleware/auth");
const { mustRole } = require("../middleware/role");
const { getAll, getDetail, getByCompany , assistMob, getServiceByTugMaster, getServiceApproved, assistConnect, assistDisconnect, submit, create, assistDemob, getServiceRequested, getAllRequested} = require("../controllers/tug-service");

const router = express.Router();

//Tug Service
router.get("/", authenticate, mustRole("TUG_MASTER"), getServiceByTugMaster);
router.get("/sys-all", authenticate, mustRole("SYS_ADMIN"), getAll);
router.get("/all", authenticate, getServiceApproved);
router.get("/sys-requested", authenticate, getAllRequested);
router.get("/requested", authenticate, getServiceRequested);
router.get("/:id/detail", authenticate, getDetail);
router.get("/company", authenticate, getByCompany);
router.get("/:id/submit", authenticate, submit);
router.post("/", authenticate , mustRole("ADMIN"), create)


//Tug Service Detail action
router.put("/:id/mob", authenticate, mustRole("TUG_MASTER"), assistMob);
router.put("/:id/connect", authenticate, mustRole("TUG_MASTER"), assistConnect);
router.put("/:id/disconnect", authenticate, mustRole("TUG_MASTER"), assistDisconnect);
router.put("/:id/demob", authenticate, mustRole("TUG_MASTER"), assistDemob);


module.exports = router;
