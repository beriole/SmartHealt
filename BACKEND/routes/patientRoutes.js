const express = require('express');
const router = express.Router();
const { validate } = require('../validators');
const { patientValidation, paginationValidation } = require('../validators/validators');
const patientController = require('../controllers/patientController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('ADMIN', 'MEDECIN'), validate(paginationValidation), patientController.getAll);
router.get('/:id', authenticate, patientController.getById);
// La création de patient (Phase 1) lors de l'inscription via Utilisateur se fait 
// en interne, ce endpoint POST est probablement pour les admins ou test
router.post('/', authenticate, authorize('ADMIN'), validate(patientValidation.create), patientController.create);
router.put('/:id', authenticate, patientController.update);

module.exports = router;
