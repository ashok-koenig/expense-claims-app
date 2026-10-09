const { Router } = require('express');
const controller = require('../controllers/rates.controller');
const validateConversion = require('../middleware/validateConversion');

const router = Router();

router.get('/convert', validateConversion, controller.convert);

module.exports = router;
