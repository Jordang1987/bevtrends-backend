const express = require('express');
const router = express.Router();
const { getTrendingDrinks } = require('../controllers/trendsController');

router.get('/', getTrendingDrinks);

module.exports = router;
