const express = require('express');
const router = express.Router();
const professionnelController = require('../controllers/professionnelController');

const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', professionnelController.getAll);
router.get('/:id', professionnelController.getById);

router.put('/:id/upload-document', authenticate, authorize('MEDECIN', 'INFIRMIER', 'ADMIN'), upload.single('document'), professionnelController.uploadDocument);
router.post('/:id/verify', authenticate, authorize('ADMIN'), professionnelController.verifyDocument);

module.exports = router;
