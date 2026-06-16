const express = require('express');
const router = express.Router();
const triageController = require('../controllers/triageController');
const { authenticate, authorize } = require('../middleware/auth');

// Données médicales sensibles : toutes les routes exigent une authentification.
router.get('/', authenticate, authorize('MEDECIN', 'ADMIN'), triageController.getAll);
router.get('/:id', authenticate, triageController.getById);
router.post('/', authenticate, triageController.create);
router.put('/:id/suivi', authenticate, triageController.updateSuivi);

module.exports = router;
