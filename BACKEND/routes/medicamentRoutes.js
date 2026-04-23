const express = require('express');
const router = express.Router();
const { validate } = require('../validators');
const { medicamentValidation, paginationValidation } = require('../validators/validators');
const medicamentController = require('../controllers/medicamentController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', validate(paginationValidation), medicamentController.getAll);
router.get('/:id', medicamentController.getById);
router.post('/', authenticate, authorize('PHARMACIEN'), upload.single('image'), validate(medicamentValidation.create), medicamentController.create);
router.put('/:id', authenticate, authorize('PHARMACIEN'), upload.single('image'), medicamentController.update);

module.exports = router;
