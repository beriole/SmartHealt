const express = require('express');
const router = express.Router();
const { validate } = require('../validators');
const { consultationValidation } = require('../validators/validators');
const consultationController = require('../controllers/consultationController');

router.get('/', consultationController.getAll);
router.get('/:id', consultationController.getById);
router.post('/', validate(consultationValidation.create), consultationController.create);
router.put('/:id', consultationController.update);

module.exports = router;
