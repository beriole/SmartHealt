const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { authenticate, authorize } = require('../middleware/auth');
const { authenticateB2B, requireScope } = require('../middleware/b2bAuth');

const onboardingCtrl = require('../controllers/b2bOnboardingController');
const adminB2bCtrl = require('../controllers/adminB2bController');
const gatewayCtrl = require('../controllers/b2bGatewayController');
const patientB2bCtrl = require('../controllers/patientB2bController');
const b2bVisiteCtrl = require('../controllers/b2bVisiteController');

// 1. Onboarding (KYC) - Public/Ouvert aux futurs partenaires
router.post('/onboarding', upload.single('documents'), onboardingCtrl.demanderAgrement);

// 2. Gestion Admin (Interne à SmartHealth)
router.get('/admin/demandes', authenticate, authorize('ADMIN'), adminB2bCtrl.listerDemandes);
router.post('/admin/:id/valider', authenticate, authorize('ADMIN'), adminB2bCtrl.validerPartenaire);
router.post('/admin/:id/revoquer', authenticate, authorize('ADMIN'), adminB2bCtrl.revoquerPartenaire);

// 3. Gateway Authentification (Machine-To-Machine)
router.post('/oauth/token', gatewayCtrl.generateToken);

// 4. Action du Patient : Génération du PIN de consentement
// Protégé par l'authentification standard de l'application (le patient est connecté)
router.post('/patient/generer-pin', authenticate, patientB2bCtrl.genererPinConsentement);

// 5. Espaces d'Interaction Médicale B2B (API Externe)
// Ping test
router.get('/ping-auth', authenticateB2B, requireScope('ordonnance:write'), (req, res) => {
  res.json({ 
    success: true, 
    message: 'Authentification B2B réussie. Vous avez la permission décrire une ordonnance.',
    partenaire: req.partenaire 
  });
});

// Endpoint Composite : Création d'une visite (Consultation + Ordonnance)
router.post('/dossier-medical/visite', authenticateB2B, requireScope('consultation:write'), b2bVisiteCtrl.creerVisiteComposite);

module.exports = router;
