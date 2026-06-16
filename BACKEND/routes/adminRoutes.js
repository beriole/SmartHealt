const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const articleController = require('../controllers/articleController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Toutes les routes d'administration sont réservées au rôle ADMIN
router.use(authenticate, authorize('ADMIN'));

// Tableau de bord et statistiques globales
router.get('/dashboard', adminController.getDashboard);

// Gestion financière : revenus, transactions, commissions, rapports
router.get('/finances', adminController.getFinances);

// Journalisation et sécurité
router.get('/audit', adminController.getAudit);
router.get('/securite/activites-suspectes', adminController.getActivitesSuspectes);
router.put('/utilisateurs/:id/statut', adminController.setStatutCompte);

// Gestion de contenu (écriture) — la lecture publique est sur /api/articles
router.get('/articles', articleController.getAllAdmin);
router.post('/articles', upload.single('image'), articleController.create);
router.put('/articles/:id', upload.single('image'), articleController.update);
router.delete('/articles/:id', articleController.remove);

module.exports = router;
