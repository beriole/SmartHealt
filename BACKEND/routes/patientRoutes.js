const express = require('express');
const router = express.Router();
const { validate } = require('../validators');
const { patientValidation, paginationValidation } = require('../validators/validators');
const patientController = require('../controllers/patientController');

router.get('/', validate(paginationValidation), patientController.getAll);
router.get('/:id', patientController.getById);
router.post('/', validate(patientValidation.create), patientController.create);
router.put('/:id', patientController.update);

module.exports = router;
