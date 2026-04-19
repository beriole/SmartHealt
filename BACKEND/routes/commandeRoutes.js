const express = require('express');
const router = express.Router();
const { validate } = require('../validators');
const { commandeValidation } = require('../validators/validators');
const commandeController = require('../controllers/commandeController');

router.get('/', commandeController.getAll);
router.get('/:id', commandeController.getById);
router.post('/', validate(commandeValidation.create), commandeController.create);
router.put('/:id', commandeController.update);

module.exports = router;
