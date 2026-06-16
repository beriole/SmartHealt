const express = require('express');
const router = express.Router();
const { validate } = require('../validators');
const { utilisateurValidation } = require('../validators/validators');
const authController = require('../controllers/authController');

const authLimiter = require('express-rate-limit')({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 9999 : 5,
  message: { success: false, message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Inscription d'un utilisateur
 *     description: Crée un compte et le profil métier associé (PATIENT, MEDECIN, INFIRMIER, LIVREUR). Un email de vérification est envoyé.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nom, prenom, email, telephone, mot_de_passe, type_utilisateur, sexe]
 *             properties:
 *               nom: { type: string, example: Aya }
 *               prenom: { type: string, example: Christelle }
 *               email: { type: string, example: nouvelle@exemple.cm }
 *               telephone: { type: string, example: "+237690000099" }
 *               mot_de_passe: { type: string, example: Password123! }
 *               type_utilisateur: { type: string, enum: [PATIENT, MEDECIN, PHARMACIEN, INFIRMIER, LIVREUR, TUTEUR, ADMIN] }
 *               sexe: { type: string, enum: [M, F, AUTRE] }
 *               numero_ordre: { type: string, description: "Requis pour MEDECIN/INFIRMIER" }
 *               specialite: { type: string, description: "Requis pour MEDECIN" }
 *     responses:
 *       201: { description: Inscription réussie }
 *       400: { description: Validation échouée ou email/téléphone déjà utilisé, content: { application/json: { schema: { $ref: '#/components/schemas/Erreur' } } } }
 */
router.post('/register', validate(utilisateurValidation.register), authController.register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Connexion (retourne un JWT)
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, mot_de_passe]
 *             properties:
 *               email: { type: string, example: patient.aya@smarthealth.cm }
 *               mot_de_passe: { type: string, example: Password123! }
 *     responses:
 *       200: { description: "Connexion réussie : data contient utilisateur et token" }
 *       401: { description: Identifiants invalides ou email non vérifié, content: { application/json: { schema: { $ref: '#/components/schemas/Erreur' } } } }
 */
router.post('/login', authLimiter, validate(utilisateurValidation.login), authController.login);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Renouvelle l'access token à partir d'un refresh token
 *     description: Effectue la rotation du refresh token (l'ancien est révoqué, un nouveau est émis). Détecte la réutilisation d'un token déjà utilisé.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: "Nouveaux jetons : data contient token (access) et refreshToken" }
 *       401: { description: Refresh token invalide ou expiré, content: { application/json: { schema: { $ref: '#/components/schemas/Erreur' } } } }
 */
router.post('/refresh', authController.refresh);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Déconnexion (révoque le refresh token fourni)
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: Déconnexion réussie }
 */
router.post('/logout', authController.logout);

/**
 * @openapi
 * /api/auth/verify-email/{token}:
 *   get:
 *     tags: [Auth]
 *     summary: Vérification de l'adresse email
 *     security: []
 *     parameters:
 *       - { in: path, name: token, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Email vérifié }
 */
router.get('/verify-email/:token', authController.verifyEmail);

/**
 * @openapi
 * /api/auth/resend-verification:
 *   post:
 *     tags: [Auth]
 *     summary: Renvoi du lien de vérification
 *     security: []
 *     requestBody:
 *       content: { application/json: { schema: { type: object, properties: { email: { type: string } } } } }
 *     responses:
 *       200: { description: Lien renvoyé si le compte existe et n'est pas vérifié }
 */
router.post('/resend-verification', authLimiter, authController.resendVerification);

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Demande de réinitialisation du mot de passe
 *     security: []
 *     requestBody:
 *       content: { application/json: { schema: { type: object, properties: { email: { type: string } } } } }
 *     responses:
 *       200: { description: Lien de réinitialisation envoyé si le compte existe }
 */
router.post('/forgot-password', authLimiter, authController.forgotPassword);

/**
 * @openapi
 * /api/auth/reset-password/{token}:
 *   post:
 *     tags: [Auth]
 *     summary: Réinitialisation du mot de passe
 *     security: []
 *     parameters:
 *       - { in: path, name: token, required: true, schema: { type: string } }
 *     requestBody:
 *       content: { application/json: { schema: { type: object, properties: { mot_de_passe: { type: string } } } } }
 *     responses:
 *       200: { description: Mot de passe réinitialisé }
 */
router.post('/reset-password/:token', authLimiter, authController.resetPassword);

module.exports = router;
