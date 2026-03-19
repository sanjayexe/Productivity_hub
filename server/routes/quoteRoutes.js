const express = require("express");
const { getQuote } = require("../controllers/quoteController");

const router = express.Router();

// Public endpoint - no authentication needed
router.get("/", getQuote);

module.exports = router;
