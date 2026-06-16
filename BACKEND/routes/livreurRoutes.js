const express = require('express');
const router = express.Router();
const livreurController = require('../controllers/livreurController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Administration
router.get('/', authenticate, authorize('ADMIN'), livreurController.getAll);

// Partie RH et Statistiques
router.post('/register', authenticate, authorize('LIVREUR', 'ADMIN'), livreurController.registerLivreur);
router.put('/upload-document', authenticate, authorize('LIVREUR'), upload.single('document'), livreurController.uploadDocument);
router.post('/:id/verify', authenticate, authorize('ADMIN'), livreurController.verifyDocument);
router.get('/dashboard', authenticate, authorize('LIVREUR'), livreurController.getDashboard);

// Suivi temps réel et disponibilité
router.put('/position', authenticate, authorize('LIVREUR'), livreurController.updatePosition);
router.put('/disponibilite', authenticate, authorize('LIVREUR'), livreurController.setDisponibilite);

module.exports = router;
