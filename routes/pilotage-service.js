const express = require("express");
const {
  getAll,
  getRequestedServices,
} = require("../controllers/pilotage-service");
const router = express.Router();

// GET /api/service/requested
router.get("/", getAll);
router.get("/request", getRequestedServices);

module.exports = router;
