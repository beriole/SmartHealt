const express = require('express');
const router = express.Router();
const rappelController = require('../controllers/rappelController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, rappelController.createRappel);
router.get('/', authenticate, rappelController.getMesRappels);
router.get('/prises-du-jour', authenticate, rappelController.getPrisesDuJour);

router.get('/stats/globales', authenticate, rappelController.getStatsGlobales);
router.get('/stats/specifiques/:id_rappel', authenticate, rappelController.getStatsSpecifiques);

router.put('/prises/:id', authenticate, rappelController.marquerPrise);

module.exports = router;
