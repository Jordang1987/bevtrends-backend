const express = require('express');
const { getSponsoredBrands } = require('../controllers/sponsoredController');

const router = express.Router();

router.get('/', getSponsoredBrands);

module.exports = router;
