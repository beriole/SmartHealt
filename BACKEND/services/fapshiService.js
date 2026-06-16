const axios = require('axios');
require('dotenv').config();

/**
 * Client Fapshi (Direct Pay).
 * Sandbox : https://sandbox.fapshi.com | Production : https://live.fapshi.com
 * Authentification par en-têtes apiuser / apikey.
 */
const fapshiClient = axios.create({
  baseURL: process.env.FAPSHI_BASE_URL || 'https://sandbox.fapshi.com',
  headers: {
    apiuser: process.env.FAPSHI_API_USER,
    apikey: process.env.FAPSHI_API_KEY,
    'Content-Type': 'application/json',
  },
});

function isConfigured() {
  return Boolean(process.env.FAPSHI_API_USER && process.env.FAPSHI_API_KEY);
}

/**
 * Normalise un numéro camerounais au format attendu par Fapshi (9 chiffres, 6XXXXXXXX).
 * Retire l'indicatif +237 / 237 et tout caractère non numérique.
 */
function normalizePhone(phone) {
  if (!phone) return phone;
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('237')) digits = digits.slice(3);
  return digits;
}

/**
 * Déclenche une demande de paiement Mobile Money directement sur le téléphone du client.
 * Retourne { message, transId, dateInitiated }.
 */
async function directPay({ amount, phone, medium, name, email, externalId, message }) {
  const body = {
    amount: Math.round(Number(amount)),
    phone: normalizePhone(phone),
  };
  if (medium) body.medium = medium;
  if (name) body.name = name;
  if (email) body.email = email;
  if (externalId) body.externalId = externalId;
  if (message) body.message = message;

  const { data } = await fapshiClient.post('/direct-pay', body);
  return data;
}

/** Récupère le statut d'une transaction. Retourne { transId, status, ... }. */
async function getStatus(transId) {
  const { data } = await fapshiClient.get(`/payment-status/${transId}`);
  return data;
}

/** Mappe le statut Fapshi vers l'enum StatutPaiement de la base. */
function mapStatut(fapshiStatus) {
  switch (fapshiStatus) {
    case 'SUCCESSFUL':
      return 'paye';
    case 'FAILED':
    case 'EXPIRED':
      return 'echoue';
    default:
      return 'en_attente'; // CREATED, PENDING
  }
}

module.exports = {
  fapshiClient,
  isConfigured,
  normalizePhone,
  directPay,
  getStatus,
  mapStatut,
};
