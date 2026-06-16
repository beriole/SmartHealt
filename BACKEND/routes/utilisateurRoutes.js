const express = require('express');
const router = express.Router();
const { validate } = require('../validators');
const paginationValidation = require('../validators/validators');
const utilisateurController = require('../controllers/utilisateurController');
const upload = require('../middleware/upload');
const { authenticate, authorize, checkSelfOrAdmin } = require('../middleware/auth');

router.get('/', authenticate, authorize('ADMIN'), validate(paginationValidation.paginationValidation), utilisateurController.getAll);
router.get('/me', authenticate, utilisateurController.getMe);
router.get('/:id', authenticate, utilisateurController.getById);
router.put('/:id', authenticate, checkSelfOrAdmin, utilisateurController.update);
router.put('/:id/avatar', authenticate, checkSelfOrAdmin, upload.single('image'), utilisateurController.updateAvatar);
router.delete('/:id', authenticate, authorize('ADMIN'), utilisateurController.deleteUtilisateur);

module.exports = router;
