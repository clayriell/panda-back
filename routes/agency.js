const express = require("express");

const { getAll } = require("../controllers/agency");
const router = express.Router();

router.get("/", getAll);

module.exports = router;
