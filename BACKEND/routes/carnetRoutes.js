const express = require('express');
const router = express.Router();
const carnetController = require('../controllers/carnetController');
const { authenticate, authorize } = require('../middleware/auth');

// Routes spécifiques au propriétaire (PATIENT)
router.get('/my-carnet', authenticate, authorize('PATIENT'), carnetController.getMyCarnet);
router.post('/my-carnet/regenerate-qr', authenticate, authorize('PATIENT'), carnetController.regenerateQrCode);

// Route pour le scan réservée aux professionnels de santé (MEDECIN, INFIRMIER)
router.get('/scan/:qrToken', authenticate, authorize('MEDECIN', 'INFIRMIER', 'PHARMACIEN'), carnetController.scanQrCode);

// Anciennes routes génériques (sécurisons-les pour les admins)
router.get('/', authenticate, authorize('ADMIN'), carnetController.getAll);
router.get('/:id', authenticate, authorize('ADMIN'), carnetController.getById);
router.put('/:id', authenticate, authorize('ADMIN'), carnetController.update);

module.exports = router;
