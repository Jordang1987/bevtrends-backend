const express = require('express');
const {
  getNearMeTrends,
  getJournalTrends,
  getTastemakerTrends
} = require('../controllers/trendsController');

const router = express.Router();

router.get('/near-me', getNearMeTrends);
router.get('/journal', getJournalTrends);
router.get('/tastemakers', getTastemakerTrends);

module.exports = router;
