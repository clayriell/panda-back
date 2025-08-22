const express = require("express");
const router = express.Router();

const authRouter = require("./auth");
const userRouter = require("./users");
const agencyRouter = require("./agency");
const pilotageServiceRouter = require("./pilotage-service");
const terminalRouter = require("./terminal");

// Mount semua route
router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/agency", agencyRouter);
router.use("/terminal", terminalRouter);
router.use("/pilotage-service", pilotageServiceRouter);

module.exports = router;
