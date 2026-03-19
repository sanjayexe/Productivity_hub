const express = require('express');
const router = express.Router();
const { generatePlan } = require('../controllers/plannerController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate', protect, generatePlan);

module.exports = router;
