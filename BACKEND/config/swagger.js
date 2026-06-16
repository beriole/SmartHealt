const swaggerJsdoc = require('swagger-jsdoc');

// Spécification OpenAPI 3 décrivant l'API SmartHealth.
// Les routes sont regroupées par tag ; l'authentification se fait par JWT Bearer.
const definition = {
  openapi: '3.0.3',
  info: {
    title: 'SmartHealth API',
    version: '1.0.0',
    description:
      "API de la plateforme de santé numérique SmartHealth : carnets de santé, consultations, ordonnances, marketplace pharmacies, livraison, administration et modules d'intelligence artificielle (diagnostic, compatibilité médicamenteuse, analyse prédictive, recommandation de traitements, médecine traditionnelle).\n\n**Authentification** : connectez-vous via `POST /api/auth/login`, récupérez le `token`, puis cliquez sur **Authorize** et collez-le.\n\nComptes de démo (après `npm run seed`, mot de passe `Password123!`) :\n- admin@smarthealth.cm (ADMIN)\n- dr.kamga@smarthealth.cm (MEDECIN)\n- pharm.essomba@smarthealth.cm (PHARMACIEN)\n- patient.aya@smarthealth.cm (PATIENT)",
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Développement local' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Erreur: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          code: { type: 'string', example: 'UNAUTHORIZED' },
          message: { type: 'string', example: 'Token requis' },
        },
      },
      Succes: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Auth', description: 'Inscription, connexion, mot de passe' },
    { name: 'Utilisateurs', description: 'Gestion des comptes' },
    { name: 'Patients', description: 'Dossiers patients' },
    { name: 'Professionnels', description: 'Médecins et infirmiers' },
    { name: 'Carnets', description: 'Carnet de santé numérique (QR code)' },
    { name: 'Consultations', description: 'Consultations médicales' },
    { name: 'Ordonnances', description: 'Ordonnances électroniques' },
    { name: 'Médicaments', description: 'Catalogue de médicaments' },
    { name: 'Pharmacies', description: 'Pharmacies et employés' },
    { name: 'Stocks', description: 'Inventaire, alertes, mouvements' },
    { name: 'Commandes', description: 'Commandes, paiement, logistique' },
    { name: 'Livreurs', description: 'Livraison et suivi' },
    { name: 'Interventions', description: 'Soins à domicile' },
    { name: 'Triage', description: 'Sessions de triage' },
    { name: 'Rappels', description: 'Rappels de traitement' },
    { name: 'IA', description: "Modules d'intelligence artificielle" },
    { name: 'Administration', description: 'Tableau de bord, finances, audit, contenu' },
    { name: 'Articles', description: 'Contenu santé public' },
    { name: 'B2B', description: 'Partenaires externes (OAuth 2.0)' },
  ],
};

const options = {
  definition,
  // Annotations JSDoc @openapi présentes dans les fichiers de routes
  apis: ['./routes/*.js'],
};

module.exports = swaggerJsdoc(options);
