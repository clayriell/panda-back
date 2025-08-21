const express = require("express");

const { getAll } = require("../controllers/agency");
const { route } = require("./users");
const router = express.Router();

router.get("/", getAll);

module.exports = router;
