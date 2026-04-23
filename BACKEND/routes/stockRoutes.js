const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { authenticate, authorize } = require('../middleware/auth');

// Recherche accessible à tous les utilisateurs authentifiés (Patients et Externes)
router.get('/search', authenticate, stockController.searchGlobalStock);

// Gestion de l'inventaire par le pharmacien
router.get('/my-stocks', authenticate, authorize('PHARMACIEN'), stockController.getMyStocks);
router.post('/', authenticate, authorize('PHARMACIEN', 'ADMIN'), stockController.createStock);
router.put('/:id', authenticate, authorize('PHARMACIEN', 'ADMIN'), stockController.updateStock);
router.delete('/:id', authenticate, authorize('PHARMACIEN', 'ADMIN'), stockController.deleteStock);

module.exports = router;
