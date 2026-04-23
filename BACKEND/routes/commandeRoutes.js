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

// Intégration de paiement NotchPay
router.post('/:id/payer', authenticate, commandeController.initiatePayment);
router.get('/callback/verify', commandeController.verifyPaymentCallback);
router.post('/webhook/notchpay', commandeController.webhookNotchPay); // sans auth requise, vérification hmac

module.exports = router;
