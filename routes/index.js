const express = require("express");
const router = express.Router();

const authRouter = require("./auth");
const userRouter = require("./users");
const agencyRouter = require("./agency");
const pilotageServiceRouter = require("./pilotage-service");
const terminalRouter = require("./terminal");
const assistTugRouter = require("./assist-tug");
const companyRouter = require("./company");
const tugServiceRouter = require("./tug-service");
const validationRouter = require("./validation");
const {getForm} =  require("../controllers/pilotage-service");
// Mount semua route
router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/agency", agencyRouter);
router.use("/terminal", terminalRouter);
router.use("/assist-tug", assistTugRouter);
router.use("/company", companyRouter);
router.use("/pilotage-service", pilotageServiceRouter);
router.use("/tug-service", tugServiceRouter);
router.use("/validate", validationRouter);
router.use("/service/:id", getForm)

module.exports = router;
