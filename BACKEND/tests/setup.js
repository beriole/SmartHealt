require('dotenv').config({ path: '.env.test' });

// Mock de l'envoi d'emails : aucun email réel n'est envoyé pendant les tests.
// (jest.mock est hissé en haut du fichier et s'applique à toute la suite.)
jest.mock('../utils/email', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendRappelEmail: jest.fn().mockResolvedValue(true),
  sendOrdonnanceNotification: jest.fn().mockResolvedValue(true),
  sendCommandeNotification: jest.fn().mockResolvedValue(true),
  sendB2bValidationEmail: jest.fn().mockResolvedValue(true),
  sendB2bRejectionEmail: jest.fn().mockResolvedValue(true),
  sendPinLivraisonEmail: jest.fn().mockResolvedValue(true),
}));

const { connectDatabase, disconnectDatabase } = require('../services/database');

beforeAll(async () => {
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes('test')) {
    throw new Error('Les tests doivent être exécutés sur une base de données de test !');
  }
  await connectDatabase();
});

afterAll(async () => {
  await disconnectDatabase();
});
