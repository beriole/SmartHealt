const express = require('express');
const router = express.Router();
const interventionController = require('../controllers/interventionController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, interventionController.getAll);
router.get('/:id', authenticate, interventionController.getById);

// Le patient planifie une intervention
router.post('/', authenticate, authorize('PATIENT'), interventionController.create);

// Le professionnel met à jour le statut (en cours, terminée) ou ajoute un compte-rendu
router.put('/:id/status', authenticate, authorize('MEDECIN', 'INFIRMIER', 'ADMIN'), interventionController.updateStatus);

module.exports = router;
