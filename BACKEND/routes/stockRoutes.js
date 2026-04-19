const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { authenticate } = require('../middleware/auth');

// Recherche accessible à tous les utilisateurs authentifiés (Patients et Externes)
router.get('/search', authenticate, stockController.searchGlobalStock);

module.exports = router;
