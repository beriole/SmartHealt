const express = require('express');
const router = express.Router();
const professionnelController = require('../controllers/professionnelController');

router.get('/', professionnelController.getAll);
router.get('/:id', professionnelController.getById);

module.exports = router;
