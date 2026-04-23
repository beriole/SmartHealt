require('dotenv').config({ path: '.env.test' });
const { prisma, connectDatabase, disconnectDatabase } = require('../services/database');

beforeAll(async () => {
  // Configurer la bonne base de test via url (sécurité supplémentaire)
  if (!process.env.DATABASE_URL.includes('test')) {
    throw new Error('Les tests doivent être exécutés sur une base de données de test !');
  }
  await connectDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
});

// Vider la base avant chaque fichier de test (et non avant chaque IT)
beforeAll(async () => {
  // Purger toutes les tables principales dans l'ordre pour respecter les Foreign Keys
  const tableNames = [
    'LigneCommande', 'Commande', 'StockPharmacie', 'LigneOrdonnance',
    'PriseMedicament', 'RappelTraitement', 'InterventionDomicile',
    'Ordonnance', 'Consultation', 'AccesCarnet', 'CarnetSante',
    'TriageIa', 'Patient', 'ProfessionnelSante', 'Pharmacie',
    'Medicament', 'Utilisateur'
  ];

  for (const table of tableNames) {
    try {
      const modelName = table.charAt(0).toLowerCase() + table.slice(1);
      if (prisma[modelName]) {
        await prisma[modelName].deleteMany({});
      }
    } catch (error) {
      console.error(`Erreur lors du nettoyage de la table ${table}:`, error);
    }
  }
});
