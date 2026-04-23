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

router.post('/', authenticate, authorize('ADMIN'), upload.single('image'), validate(pharmacieValidation.create), pharmacieController.create);
router.put('/:id', authenticate, authorize('ADMIN', 'PHARMACIEN'), upload.single('image'), pharmacieController.update);

module.exports = router;
