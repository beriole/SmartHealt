const { prisma } = require('./database');
const logger = require('../utils/logger');

/**
 * Journalisation des actions sensibles (non-bloquante).
 * Une erreur d'audit ne doit jamais faire échouer la requête métier.
 */
async function logAction({ id_utilisateur = null, action, ressource, id_ressource = null, details = null, req = null }) {
  try {
    await prisma.journalAudit.create({
      data: {
        id_utilisateur,
        action,
        ressource,
        id_ressource,
        details: details || undefined,
        adresse_ip: req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null) : null,
      },
    });
  } catch (error) {
    logger.error(`Erreur journalisation audit (${action}): ${error.message}`);
  }
}

module.exports = { logAction };
