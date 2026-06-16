const { NotFoundError, ForbiddenError, ValidationError } = require('../errors/AppError');
const { prisma } = require('../services/database');
const { predictObservance } = require('../services/mlService');

exports.createRappel = async (req, res, next) => {
  try {
    const { id_ordonnance, id_medicament, frequence, heure_prise, date_debut, date_fin, canal_notification, alerte_tuteur_active } = req.body;

    const patient = await prisma.patient.findUnique({
      where: { id_utilisateur: req.user.id }
    });

    if (!patient) throw new ForbiddenError('Seuls les patients peuvent créer un rappel.');

    const start = new Date(date_debut);
    const end = new Date(date_fin);
    if (start >= end) throw new ValidationError('La date de fin doit être après la date de début.');

    const rappel = await prisma.$transaction(async (tx) => {
      const newRappel = await tx.rappelTraitement.create({
        data: {
          id_patient: patient.id_patient,
          id_ordonnance,
          id_medicament,
          frequence,
          heure_prise,
          date_debut: start,
          date_fin: end,
          canal_notification: canal_notification || 'sms',
          alerte_tuteur_active: alerte_tuteur_active || false
        }
      });

      // Générer les prises (Simplification: on suppose une fréquence journalière pour l'exemple)
      const prisesToCreate = [];
      let currentDate = new Date(start);
      while (currentDate <= end) {
        for (const heure of heure_prise) {
          const [h, m] = heure.split(':');
          const dateHeurePrevue = new Date(currentDate);
          dateHeurePrevue.setHours(parseInt(h), parseInt(m), 0, 0);

          prisesToCreate.push({
            id_rappel: newRappel.id_rappel,
            date_heure_prevue: dateHeurePrevue,
            statut_prise: 'en_attente'
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (prisesToCreate.length > 0) {
        await tx.priseMedicament.createMany({ data: prisesToCreate });
      }

      return newRappel;
    });

    res.status(201).json({ success: true, message: 'Rappel configuré avec succès', data: rappel });
  } catch (error) {
    next(error);
  }
};

exports.getMesRappels = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { id_utilisateur: req.user.id } });
    if (!patient) throw new ForbiddenError('Patient introuvable.');

    const rappels = await prisma.rappelTraitement.findMany({
      where: { id_patient: patient.id_patient },
      include: { medicament: true, ordonnance: true },
      orderBy: { date_debut: 'desc' }
    });

    res.json({ success: true, data: rappels });
  } catch (error) {
    next(error);
  }
};

exports.getPrisesDuJour = async (req, res, next) => {
  try {
    const { date } = req.query; // format YYYY-MM-DD
    const patient = await prisma.patient.findUnique({ where: { id_utilisateur: req.user.id } });
    if (!patient) throw new ForbiddenError('Patient introuvable.');

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const prises = await prisma.priseMedicament.findMany({
      where: {
        rappel: { id_patient: patient.id_patient },
        date_heure_prevue: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: { rappel: { include: { medicament: true } } },
      orderBy: { date_heure_prevue: 'asc' }
    });

    res.json({ success: true, data: prises });
  } catch (error) {
    next(error);
  }
};

exports.marquerPrise = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { statut_prise, commentaire } = req.body;

    const validStatuses = ['prise', 'manquee', 'reportee'];
    if (!validStatuses.includes(statut_prise)) {
      throw new ValidationError('Statut invalide. Utilisez prise, manquee ou reportee.');
    }

    const patient = await prisma.patient.findUnique({ where: { id_utilisateur: req.user.id } });
    
    // Vérifier l'appartenance
    const prise = await prisma.priseMedicament.findUnique({
      where: { id_prise: id },
      include: { rappel: true }
    });

    if (!prise) throw new NotFoundError('Prise de médicament');
    if (patient && prise.rappel.id_patient !== patient.id_patient) {
      throw new ForbiddenError('Vous ne pouvez modifier que vos propres prises.');
    }

    const updated = await prisma.priseMedicament.update({
      where: { id_prise: id },
      data: {
        statut_prise,
        commentaire,
        date_heure_reelle: statut_prise === 'prise' ? new Date() : null
      }
    });

    res.json({ success: true, message: `Prise marquée comme ${statut_prise}`, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.getStatsGlobales = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { id_utilisateur: req.user.id } });
    if (!patient) throw new ForbiddenError('Patient introuvable.');

    // Calculer le taux global d'observance (nombre de prises statut 'prise' / total des prises prévues jusqu'à aujourd'hui)
    const now = new Date();
    
    const [totalPrises, prisesEffectuees, prisesManquees] = await Promise.all([
      prisma.priseMedicament.count({
        where: { rappel: { id_patient: patient.id_patient }, date_heure_prevue: { lte: now } }
      }),
      prisma.priseMedicament.count({
        where: { rappel: { id_patient: patient.id_patient }, date_heure_prevue: { lte: now }, statut_prise: 'prise' }
      }),
      prisma.priseMedicament.count({
        where: { rappel: { id_patient: patient.id_patient }, date_heure_prevue: { lte: now }, statut_prise: 'manquee' }
      })
    ]);

    const tauxObservance = totalPrises > 0 ? (prisesEffectuees / totalPrises) * 100 : 0;

    res.json({
      success: true,
      data: {
        total_prises_passees: totalPrises,
        prises_effectuees: prisesEffectuees,
        prises_manquees: prisesManquees,
        taux_observance_pourcentage: Math.round(tauxObservance * 100) / 100
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Prédit, via le modèle d'observance interne, le risque d'oubli des prochaines prises
 * du patient — afin de cibler les rappels et alerter le tuteur si nécessaire.
 */
exports.getRisqueObservance = async (req, res, next) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { id_utilisateur: req.user.id },
      include: { utilisateur: { select: { date_naissance: true } } },
    });
    if (!patient) throw new ForbiddenError('Patient introuvable.');

    const now = new Date();

    // Observance historique + nombre de traitements actifs
    const [total, effectuees, traitementsActifs] = await Promise.all([
      prisma.priseMedicament.count({ where: { rappel: { id_patient: patient.id_patient }, date_heure_prevue: { lte: now } } }),
      prisma.priseMedicament.count({ where: { rappel: { id_patient: patient.id_patient }, date_heure_prevue: { lte: now }, statut_prise: 'prise' } }),
      prisma.rappelTraitement.count({ where: { id_patient: patient.id_patient, statut: 'actif' } }),
    ]);
    const tauxHist = total > 0 ? effectuees / total : 0.9;

    const age = patient.utilisateur.date_naissance
      ? Math.floor((Date.now() - new Date(patient.utilisateur.date_naissance).getTime()) / (365.25 * 24 * 3600 * 1000))
      : 40;

    // Prochaines prises en attente
    const prochaines = await prisma.priseMedicament.findMany({
      where: { rappel: { id_patient: patient.id_patient }, statut_prise: 'en_attente', date_heure_prevue: { gte: now } },
      include: { rappel: { include: { medicament: true } } },
      orderBy: { date_heure_prevue: 'asc' },
      take: 8,
    });

    const evaluations = [];
    for (const prise of prochaines) {
      const d = new Date(prise.date_heure_prevue);
      const joursDepuis = Math.max(0, Math.floor((d.getTime() - new Date(prise.rappel.date_debut).getTime()) / (24 * 3600 * 1000)));
      const pred = await predictObservance({
        age,
        nb_traitements_actifs: traitementsActifs,
        taux_observance_historique: Math.round(tauxHist * 100) / 100,
        heure_prise: d.getHours(),
        jour_semaine: (d.getDay() + 6) % 7, // JS dimanche=0 → lundi=0
        jours_depuis_debut: joursDepuis,
      });
      if (pred) {
        evaluations.push({
          id_prise: prise.id_prise,
          medicament: prise.rappel.medicament?.nom_commercial,
          date_heure_prevue: prise.date_heure_prevue,
          probabilite_oubli_pourcent: pred.probabilite_oubli_pourcent,
          niveau_risque: pred.niveau_risque,
          facteurs: pred.facteurs,
        });
      }
    }

    if (evaluations.length === 0) {
      return res.json({
        success: true,
        data: {
          disponible: false,
          message: "Aucune prise à venir, ou modèle d'observance indisponible.",
          taux_observance_historique_pourcent: Math.round(tauxHist * 100),
        },
      });
    }

    res.json({
      success: true,
      data: {
        version_modele: 'randomforest-observance-v1',
        taux_observance_historique_pourcent: Math.round(tauxHist * 100),
        traitements_actifs: traitementsActifs,
        prises_a_risque: evaluations.filter(e => ['eleve', 'tres_eleve'].includes(e.niveau_risque)),
        evaluations,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getStatsSpecifiques = async (req, res, next) => {
  try {
    const { id_rappel } = req.params;
    const patient = await prisma.patient.findUnique({ where: { id_utilisateur: req.user.id } });
    
    const rappel = await prisma.rappelTraitement.findUnique({ where: { id_rappel } });
    if (!rappel) throw new NotFoundError('Rappel');
    
    if (patient && rappel.id_patient !== patient.id_patient) {
      throw new ForbiddenError('Accès non autorisé.');
    }

    const now = new Date();
    const [totalPrises, prisesEffectuees] = await Promise.all([
      prisma.priseMedicament.count({
        where: { id_rappel, date_heure_prevue: { lte: now } }
      }),
      prisma.priseMedicament.count({
        where: { id_rappel, date_heure_prevue: { lte: now }, statut_prise: 'prise' }
      })
    ]);

    const tauxObservance = totalPrises > 0 ? (prisesEffectuees / totalPrises) * 100 : 0;

    res.json({
      success: true,
      data: {
        id_rappel,
        id_medicament: rappel.id_medicament,
        total_prises_passees: totalPrises,
        prises_effectuees: prisesEffectuees,
        taux_observance_pourcentage: Math.round(tauxObservance * 100) / 100
      }
    });
  } catch (error) {
    next(error);
  }
};
