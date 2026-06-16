const cron = require('node-cron');
const { prisma } = require('./database');
const { sendRappelEmail } = require('../utils/email');
const logger = require('../utils/logger');

/**
 * Cron 1 (toutes les minutes) : notifie les prises de médicaments imminentes
 * (dans les 15 prochaines minutes) par email.
 */
function cronNotificationsPrises() {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const in15Minutes = new Date(now.getTime() + 15 * 60000);

      const prisesImminentes = await prisma.priseMedicament.findMany({
        where: {
          statut_prise: 'en_attente',
          notification_envoyee: false,
          date_heure_prevue: { gte: now, lte: in15Minutes },
        },
        include: {
          rappel: {
            include: {
              patient: { include: { utilisateur: true } },
              medicament: true,
            },
          },
        },
      });

      if (prisesImminentes.length === 0) return;
      logger.info(`[CRON] ${prisesImminentes.length} prise(s) imminente(s) — envoi des rappels...`);

      for (const prise of prisesImminentes) {
        const utilisateur = prise.rappel.patient.utilisateur;
        const medName = prise.rappel.medicament.nom_commercial;
        const timeStr = prise.date_heure_prevue.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        if (utilisateur.email) {
          await sendRappelEmail(utilisateur.email, utilisateur.prenom, medName, timeStr);
        }

        await prisma.priseMedicament.update({
          where: { id_prise: prise.id_prise },
          data: { notification_envoyee: true },
        });
      }
    } catch (error) {
      logger.error(`[CRON] Erreur notifications de prises : ${error.message}`);
    }
  });
}

/**
 * Cron 2 (toutes les heures) : marque comme "manquée" toute prise en attente
 * dont l'heure prévue est dépassée de plus de 2 heures.
 */
function cronPrisesManquees() {
  cron.schedule('0 * * * *', async () => {
    try {
      const limite = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const result = await prisma.priseMedicament.updateMany({
        where: { statut_prise: 'en_attente', date_heure_prevue: { lt: limite } },
        data: { statut_prise: 'manquee' },
      });
      if (result.count > 0) {
        logger.info(`[CRON] ${result.count} prise(s) marquée(s) comme manquée(s).`);
      }
    } catch (error) {
      logger.error(`[CRON] Erreur marquage prises manquées : ${error.message}`);
    }
  });
}

/**
 * Cron 3 (tous les jours à 2h) : archive les ordonnances dont la date
 * d'expiration est dépassée (statut -> expiree).
 */
function cronOrdonnancesExpirees() {
  cron.schedule('0 2 * * *', async () => {
    try {
      const result = await prisma.ordonnance.updateMany({
        where: {
          date_expiration: { lt: new Date() },
          statut: { in: ['active', 'partiellement_servie'] },
        },
        data: { statut: 'expiree' },
      });
      if (result.count > 0) {
        logger.info(`[CRON] ${result.count} ordonnance(s) expirée(s) archivée(s).`);
      }
    } catch (error) {
      logger.error(`[CRON] Erreur archivage ordonnances : ${error.message}`);
    }
  });
}

const initRappelCron = () => {
  cronNotificationsPrises();
  cronPrisesManquees();
  cronOrdonnancesExpirees();
  logger.info('[CRON] Tâches planifiées initialisées (rappels, prises manquées, ordonnances expirées).');
};

module.exports = { initRappelCron };
