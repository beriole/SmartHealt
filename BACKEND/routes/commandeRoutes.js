const express = require('express');
const router = express.Router();
const { validate } = require('../validators');
const { commandeValidation } = require('../validators/validators');
const commandeController = require('../controllers/commandeController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, commandeController.getAll);
router.get('/:id', authenticate, commandeController.getById);

// Création de commande directe (panier) ou depuis ordonnance numérique
router.post('/', authenticate, validate(commandeValidation.create), commandeController.create);
router.post('/from-ordonnance', authenticate, commandeController.createFromOrdonnance);

router.put('/:id', authenticate, commandeController.update);

module.exports = router;
