const express = require('express');
const router = express.Router();
const triageController = require('../controllers/triageController');

router.get('/', triageController.getAll);
router.get('/:id', triageController.getById);
router.post('/', triageController.create);
router.put('/:id/suivi', triageController.updateSuivi);

module.exports = router;
