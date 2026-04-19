const express = require('express');
const router = express.Router();
const { validate } = require('../validators');
const { medicamentValidation, paginationValidation } = require('../validators/validators');
const medicamentController = require('../controllers/medicamentController');

router.get('/', validate(paginationValidation), medicamentController.getAll);
router.get('/:id', medicamentController.getById);
router.post('/', validate(medicamentValidation.create), medicamentController.create);
router.put('/:id', medicamentController.update);

module.exports = router;
