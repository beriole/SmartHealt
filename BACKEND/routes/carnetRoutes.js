const express = require('express');
const router = express.Router();
const carnetController = require('../controllers/carnetController');

router.get('/', carnetController.getAll);
router.get('/:id', carnetController.getById);
router.put('/:id', carnetController.update);

module.exports = router;
