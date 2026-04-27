const cron = require('node-cron');
const { prisma } = require('./database');
const { sendNotificationEmail } = require('../utils/email');

const initRappelCron = () => {
  // Exécuter toutes les minutes
  cron.schedule('* * * * *', async () => {
    console.log('[CRON] Vérification des prises de médicaments...');
    try {
      const now = new Date();
      // On cherche les prises prévues dans les 15 prochaines minutes, et non encore notifiées
      const in15Minutes = new Date(now.getTime() + 15 * 60000);

      const prisesImminentes = await prisma.priseMedicament.findMany({
        where: {
          statut_prise: 'en_attente',
          notification_envoyee: false,
          date_heure_prevue: {
            gte: now,
            lte: in15Minutes
          }
        },
        include: {
          rappel: {
            include: {
              patient: { include: { utilisateur: true } },
              medicament: true
            }
          }
        }
      });

      if (prisesImminentes.length === 0) return;

      console.log(`[CRON] ${prisesImminentes.length} prise(s) imminente(s) détectée(s). Envoi des alertes...`);

      for (const prise of prisesImminentes) {
        const patientEmail = prise.rappel.patient.utilisateur.email;
        const medName = prise.rappel.medicament.nom_commercial;
        const timeStr = prise.date_heure_prevue.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        // Envoi Email
        // Dans la réalité, vous auriez un sendSMS(patientPhone, message) selon canal_notification
        if (patientEmail) {
          const fakeMock = {
            subject: 'Rappel de Médicament - SmartHealth',
            text: `Bonjour ${prise.rappel.patient.utilisateur.prenom}, il est temps de prendre votre médicament : ${medName} à ${timeStr}. N'oubliez pas de valider la prise dans l'application !`
          };
          // On mock pour l'instant via console pour ne pas bloquer, ou on utilise l'utilitaire si dispo
          console.log(`[ALERTE] Email envoyé à ${patientEmail} pour ${medName}`);
        }

        // Marquer comme envoyée
        await prisma.priseMedicament.update({
          where: { id_prise: prise.id_prise },
          data: { notification_envoyee: true }
        });
      }
    } catch (error) {
      console.error('[CRON] Erreur lors de la vérification des prises:', error);
    }
  });
};

module.exports = { initRappelCron };
