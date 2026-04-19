const express = require('express');
const router = express.Router();
const ordonnanceController = require('../controllers/ordonnanceController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, ordonnanceController.getAll);
router.get('/:id', authenticate, ordonnanceController.getById);

// Seuls les MEDECIN ou ADMIN peuvent émettre des ordonnances
router.post('/', authenticate, authorize('MEDECIN', 'ADMIN'), ordonnanceController.create);
router.put('/:id', authenticate, authorize('MEDECIN', 'ADMIN'), ordonnanceController.update);

module.exports = router;
