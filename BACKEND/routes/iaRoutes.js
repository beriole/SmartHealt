const express = require('express');
const router = express.Router();
const iaController = require('../controllers/iaController');
const { authenticate, authorize } = require('../middleware/auth');

// Limiteur dédié : les appels IA sont coûteux (quota du fournisseur)
const iaLimiter = require('express-rate-limit')({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 9999 : 10,
  message: { success: false, message: 'Trop de requêtes IA. Patientez une minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authenticate, iaLimiter);

/**
 * @openapi
 * /api/ia/diagnostic:
 *   post:
 *     tags: [IA]
 *     summary: Diagnostic intelligent complet (ML + LLM)
 *     description: |
 *       À partir des symptômes, retourne : les maladies probables (modèle ML interne + LLM),
 *       le niveau d'urgence, la conduite à tenir, les traitements recommandés parmi les médicaments
 *       réellement en stock (avec les pharmacies, prix et id_stock), et les signes d'alarme.
 *       Si le microservice ML est indisponible, bascule automatiquement sur le LLM seul.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [symptomes]
 *             properties:
 *               symptomes: { type: array, items: { type: string }, example: ["fievre", "frissons", "courbatures", "maux_de_tete"] }
 *               duree: { type: string, example: "3 jours" }
 *               intensite: { type: string, example: "forte" }
 *               id_patient: { type: string, description: "Requis si l'appelant est un professionnel (sinon déduit du token patient)" }
 *     responses:
 *       200: { description: Analyse complète avec traitements et disponibilité en pharmacie }
 *       503: { description: Module IA non configuré (GROQ_API_KEY manquante) }
 */
router.post('/compatibilite-medicament', authorize('PATIENT', 'MEDECIN', 'ADMIN'), iaController.compatibiliteMedicament);

/**
 * @openapi
 * /api/ia/compatibilite-medicament:
 *   post:
 *     tags: [IA]
 *     summary: Compatibilité d'un médicament avec le dossier du patient
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_medicament]
 *             properties:
 *               id_medicament: { type: string }
 *               id_patient: { type: string }
 *     responses:
 *       200: { description: "Niveau (compatible/avec précautions/non recommandé/dangereux), interactions, rapport détaillé" }
 */
router.post('/analyse-predictive', authorize('PATIENT', 'MEDECIN', 'ADMIN'), iaController.analysePredictive);

/**
 * @openapi
 * /api/ia/analyse-predictive:
 *   post:
 *     tags: [IA]
 *     summary: Analyse prédictive (préventive) du carnet médical
 *     responses:
 *       200: { description: Risques identifiés, tendances, recommandations préventives }
 */
router.post('/diagnostic', authorize('PATIENT', 'MEDECIN', 'ADMIN'), iaController.diagnostic);

/**
 * @openapi
 * /api/ia/recommandation-traitement:
 *   post:
 *     tags: [IA]
 *     summary: Recommandation de traitements disponibles sur la plateforme
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               maladie: { type: string, example: Paludisme }
 *               id_analyse: { type: string, description: "Alternative : id d'un diagnostic IA précédent" }
 *     responses:
 *       200: { description: Médicaments recommandés avec posologie et pharmacies }
 */
router.post('/recommandation-traitement', authorize('PATIENT', 'MEDECIN', 'ADMIN'), iaController.recommandationTraitement);

/**
 * @openapi
 * /api/ia/medecine-traditionnelle:
 *   post:
 *     tags: [IA]
 *     summary: Remèdes traditionnels et plantes médicinales
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               symptomes: { type: array, items: { type: string } }
 *               maladie: { type: string }
 *     responses:
 *       200: { description: "Remèdes (plantes, ingrédients, préparation, précautions)" }
 */
router.post('/medecine-traditionnelle', authorize('PATIENT', 'MEDECIN', 'ADMIN'), iaController.medecineTraditionnelle);

/**
 * @openapi
 * /api/ia/historique:
 *   get:
 *     tags: [IA]
 *     summary: Historique des analyses IA du patient
 *     parameters:
 *       - { in: query, name: type_analyse, schema: { type: string } }
 *     responses:
 *       200: { description: Liste paginée des analyses }
 */
router.get('/historique', authorize('PATIENT', 'MEDECIN', 'ADMIN'), iaController.getHistorique);

/**
 * @openapi
 * /api/ia/analyses/{id}:
 *   get:
 *     tags: [IA]
 *     summary: Détail d'une analyse IA
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Analyse détaillée }
 */
router.get('/analyses/:id', iaController.getAnalyseById);

module.exports = router;
