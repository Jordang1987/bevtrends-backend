const express = require('express');
const router = express.Router();
const { getAllDrinks, getDrinkById } = require('../controllers/trendsController');

router.get('/near-me', getAllDrinks);
router.get('/:id', getDrinkById);

module.exports = router;
