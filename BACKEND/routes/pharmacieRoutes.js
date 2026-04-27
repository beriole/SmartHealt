const express = require('express');
const router = express.Router();
const { validate } = require('../validators');
const { pharmacieValidation, paginationValidation } = require('../validators/validators');
const pharmacieController = require('../controllers/pharmacieController');
const { authenticate, authorize } = require('../middleware/auth');

const upload = require('../middleware/upload');

router.get('/', validate(paginationValidation), pharmacieController.getAll);
router.get('/:id', pharmacieController.getById);

// Évaluation de la disponibilité d'une ordonnance
router.get('/:id/evaluate-ordonnance/:id_ordonnance', authenticate, pharmacieController.evaluateOrdonnance);

router.post('/', authenticate, authorize('ADMIN', 'PHARMACIEN'), upload.single('image'), validate(pharmacieValidation.create), pharmacieController.create);
router.put('/:id', authenticate, authorize('ADMIN', 'PHARMACIEN'), upload.single('image'), pharmacieController.update);

router.put('/:id/upload-document', authenticate, authorize('PHARMACIEN', 'ADMIN'), upload.single('document'), pharmacieController.uploadDocument);
router.post('/:id/verify', authenticate, authorize('ADMIN'), pharmacieController.verifyDocument);

// Gestion du Staff
router.post('/:id_pharmacie/employes', authenticate, authorize('PHARMACIEN', 'ADMIN'), pharmacieController.addEmploye);
router.get('/:id_pharmacie/employes', authenticate, authorize('PHARMACIEN', 'ADMIN'), pharmacieController.getEmployes);
router.delete('/:id_pharmacie/employes/:id_employe', authenticate, authorize('PHARMACIEN', 'ADMIN'), pharmacieController.removeEmploye);
router.delete('/:id', authenticate, authorize('ADMIN'), pharmacieController.deletePharmacie);

module.exports = router;
