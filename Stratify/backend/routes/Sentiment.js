const express = require('express');
const router = express.Router();
const SentimentAnalysis = require('../controllers/SentimentAnalysis');

router.post("/analyze", SentimentAnalysis.analyzeController);

module.exports = router;