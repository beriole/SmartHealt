const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');

// Lecture publique du contenu santé (actualités, conseils, sensibilisation)
router.get('/', articleController.getPublies);
router.get('/:id', articleController.getById);

module.exports = router;
