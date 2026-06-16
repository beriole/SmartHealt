const axios = require('axios');
const logger = require('../utils/logger');

// URL du microservice ML Python (FastAPI). Configurable via .env.
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8001';

const client = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 4000, // l'inférence est rapide ; on échoue vite si le service est down
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Prédiction de diagnostic par le modèle ML interne (RandomForest).
 * Retourne null si le service est indisponible : l'appelant bascule alors
 * sur le LLM seul (dégradation gracieuse, aucune régression).
 *
 * @param {string[]} symptomes
 * @param {number} topK
 * @returns {Promise<object|null>}
 */
async function predictDiagnostic(symptomes, topK = 5) {
  try {
    const { data } = await client.post('/predict/diagnostic', {
      symptomes,
      top_k: topK,
    });
    if (!data || data.disponible === false) return null;
    return data;
  } catch (error) {
    logger.warn(`[ML] Service de diagnostic indisponible (${error.code || error.message}) — bascule sur le LLM seul.`);
    return null;
  }
}

/**
 * Prédiction des risques (diabète, cardiovasculaire) par les modèles internes.
 * @param {object} features - profil clinique (age, sexe, imc/poids+taille, glucose, tension, etc.)
 * @returns {Promise<object|null>}
 */
async function predictRisques(features) {
  try {
    const { data } = await client.post('/predict/risque', features);
    if (!data || data.disponible === false) return null;
    return data;
  } catch (error) {
    logger.warn(`[ML] Service de risque indisponible (${error.code || error.message}) — bascule sur le LLM seul.`);
    return null;
  }
}

/**
 * Prédiction du risque d'oubli d'une prise (modèle d'observance).
 * @param {object} features - age, nb_traitements_actifs, taux_observance_historique, heure_prise, jour_semaine, jours_depuis_debut
 * @returns {Promise<object|null>}
 */
async function predictObservance(features) {
  try {
    const { data } = await client.post('/predict/observance', features);
    if (!data || data.disponible === false) return null;
    return data;
  } catch (error) {
    logger.warn(`[ML] Service d'observance indisponible (${error.code || error.message}).`);
    return null;
  }
}

/**
 * Vérifie la disponibilité du microservice ML.
 */
async function isAvailable() {
  try {
    const { data } = await client.get('/health');
    return data?.status === 'ok';
  } catch {
    return false;
  }
}

module.exports = { predictDiagnostic, predictRisques, predictObservance, isAvailable, ML_SERVICE_URL };
