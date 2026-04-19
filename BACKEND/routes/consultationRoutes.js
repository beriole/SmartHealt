const express = require('express');
const router = express.Router();
const { validate } = require('../validators');
const { consultationValidation } = require('../validators/validators');
const consultationController = require('../controllers/consultationController');
const { authenticate, authorize } = require('../middleware/auth');

// Sécurisation complète
router.get('/', authenticate, consultationController.getAll);
router.get('/:id', authenticate, consultationController.getById);

// Seuls les MEDECIN, INFIRMIER ou professionnels assimilés peuvent créer une consultation
router.post('/', authenticate, authorize('MEDECIN', 'INFIRMIER', 'ADMIN'), validate(consultationValidation.create), consultationController.create);
router.put('/:id', authenticate, authorize('MEDECIN', 'INFIRMIER', 'ADMIN'), consultationController.update);

module.exports = router;
