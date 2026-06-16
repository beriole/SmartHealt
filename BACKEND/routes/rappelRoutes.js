const express = require('express');
const router = express.Router();
const rappelController = require('../controllers/rappelController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, rappelController.createRappel);
router.get('/', authenticate, rappelController.getMesRappels);
router.get('/prises-du-jour', authenticate, rappelController.getPrisesDuJour);

// Prédiction IA du risque d'oubli des prochaines prises (modèle d'observance interne)
router.get('/risque-observance', authenticate, rappelController.getRisqueObservance);

router.get('/stats/globales', authenticate, rappelController.getStatsGlobales);
router.get('/stats/specifiques/:id_rappel', authenticate, rappelController.getStatsSpecifiques);

router.put('/prises/:id', authenticate, rappelController.marquerPrise);

module.exports = router;
