const express = require("express");
const router = express.Router();

const authRouter = require("./auth");
const userRouter = require("./users");
const pilotageServiceRouter = require("./pilotage-service");

// Mount semua route
router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/pilotage-service", pilotageServiceRouter);

module.exports = router;
