const express = require('express');
const router = express.Router();
const { validate } = require('../validators');
const paginationValidation = require('../validators/validators');
const utilisateurController = require('../controllers/utilisateurController');

router.get('/', validate(paginationValidation.paginationValidation), utilisateurController.getAll);
router.get('/:id', utilisateurController.getById);
router.put('/:id', utilisateurController.update);

module.exports = router;
