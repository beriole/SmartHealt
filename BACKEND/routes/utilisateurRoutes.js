const express = require('express');
const router = express.Router();
const { validate } = require('../validators');
const paginationValidation = require('../validators/validators');
const utilisateurController = require('../controllers/utilisateurController');
const upload = require('../middleware/upload');
const { authenticate } = require('../middleware/auth');

router.get('/', validate(paginationValidation.paginationValidation), utilisateurController.getAll);
router.get('/:id', utilisateurController.getById);
router.put('/:id', utilisateurController.update);
router.put('/:id/avatar', authenticate, upload.single('image'), utilisateurController.updateAvatar);

module.exports = router;
