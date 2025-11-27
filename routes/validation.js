const express = require('express')
const {
    validateSignature
} = require( "../controllers/validation")
const router = express.Router()

router.get("/signature/:token" , validateSignature )

module.exports = router
