const express = require("express");
const {
  register,
  getAll,
  activate,
  deactivate,
} = require("../controllers/user");
const router = express.Router();

// Endpoint login
router.post("/register", register);
router.get("/", getAll);
router.put("/:id/activate", activate);
router.put("/:id/deactivate", deactivate);
    
module.exports = router;
