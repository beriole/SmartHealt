// Global setup - runs ONCE before all tests.
// Nettoie entièrement la base de TEST pour des exécutions idempotentes
// (les tests créent leurs propres comptes vérifiés via auth-helper).
require('dotenv').config({ path: '.env.test' });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function globalSetup() {
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes('test')) {
    throw new Error('global-setup : DATABASE_URL doit pointer vers une base de TEST (.env.test)');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  // Ordre : enfants avant parents pour respecter les clés étrangères.
  const tableModels = [
    'refreshToken',
    'mouvementStock', 'ligneCommande', 'commande', 'stockPharmacie', 'ligneOrdonnance',
    'priseMedicament', 'rappelTraitement', 'interventionDomicile',
    'analyseIa', 'ordonnance', 'consultation', 'accesCarnet', 'carnetSante',
    'triageIa', 'pinConsentement', 'patient', 'professionnelSante',
    'employePharmacie', 'pharmacie', 'medicament', 'livreur',
    'partenaireB2B', 'articleSante', 'journalAudit', 'utilisateur',
  ];

  for (const model of tableModels) {
    try {
      if (prisma[model]) {
        await prisma[model].deleteMany({});
      }
    } catch (error) {
      // Table absente ou contrainte : on continue (best effort).
    }
  }

  await prisma.$disconnect();
  await pool.end();
}

module.exports = globalSetup;
