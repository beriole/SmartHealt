const express = require('express');
const router = express.Router();
const { validate } = require('../validators');
const { pharmacieValidation, paginationValidation } = require('../validators/validators');
const pharmacieController = require('../controllers/pharmacieController');

router.get('/', validate(paginationValidation), pharmacieController.getAll);
router.get('/:id', pharmacieController.getById);
router.post('/', validate(pharmacieValidation.create), pharmacieController.create);
router.put('/:id', pharmacieController.update);

module.exports = router;
