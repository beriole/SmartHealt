const express = require('express');
const router = express.Router();
const ordonnanceController = require('../controllers/ordonnanceController');

router.get('/', ordonnanceController.getAll);
router.get('/:id', ordonnanceController.getById);
router.post('/', ordonnanceController.create);
router.put('/:id', ordonnanceController.update);

module.exports = router;
