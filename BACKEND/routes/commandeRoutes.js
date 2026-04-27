const express = require('express');
const router = express.Router();
const { validate } = require('../validators');
const { commandeValidation } = require('../validators/validators');
const commandeController = require('../controllers/commandeController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, commandeController.getAll);
router.get('/:id', authenticate, commandeController.getById);

// Création de commande directe (panier) ou depuis ordonnance numérique
router.post('/', authenticate, validate(commandeValidation.create), commandeController.create);
router.post('/from-ordonnance', authenticate, commandeController.createFromOrdonnance);

// Récupération des livraisons disponibles pour les coursiers
router.get('/disponibles-livraison', authenticate, authorize('LIVREUR', 'ADMIN'), commandeController.getDisponiblesLivraison);

// Mise à jour sécurisée du suivi de colis (Réservé PHARMACIEN/ADMIN)
router.put('/:id/status', authenticate, authorize('PHARMACIEN', 'ADMIN'), commandeController.updateStatus);
router.put('/:id/annuler', authenticate, authorize('PHARMACIEN', 'ADMIN'), commandeController.annulerCommande);

// Logistique de livraison : Accepter la course, Valider avec PIN, Evaluer
router.post('/:id/assigner-livreur', authenticate, authorize('LIVREUR'), commandeController.assignLivreur);
router.post('/:id/valider-livraison', authenticate, authorize('LIVREUR', 'PATIENT', 'ADMIN'), commandeController.validerLivraison);
router.post('/:id/evaluer', authenticate, authorize('PATIENT'), commandeController.evaluerLivraison);

// Intégration de paiement NotchPay
router.post('/:id/payer', authenticate, commandeController.initiatePayment);
router.get('/callback/verify', commandeController.verifyPaymentCallback);
router.post('/webhook/notchpay', commandeController.webhookNotchPay); // sans auth requise, vérification hmac

module.exports = router;
