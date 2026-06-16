const { prisma } = require('../services/database');
const { NotFoundError, ValidationError } = require('../errors/AppError');
const { logAction } = require('../services/auditService');

/**
 * Tableau de bord global : statistiques utilisateurs, commandes,
 * consultations, médicaments, pharmacies.
 */
exports.getDashboard = async (req, res, next) => {
  try {
    const [
      utilisateursParType,
      commandesParStatut,
      totalConsultations,
      consultationsParType,
      totalMedicaments,
      totalPharmacies,
      totalOrdonnances,
      totalLivreurs,
      caTotal,
      triagesParUrgence,
    ] = await Promise.all([
      prisma.utilisateur.groupBy({ by: ['type_utilisateur'], _count: { _all: true } }),
      prisma.commande.groupBy({ by: ['statut_commande'], _count: { _all: true } }),
      prisma.consultation.count(),
      prisma.consultation.groupBy({ by: ['type_consultation'], _count: { _all: true } }),
      prisma.medicament.count(),
      prisma.pharmacie.count(),
      prisma.ordonnance.count(),
      prisma.livreur.count(),
      prisma.commande.aggregate({ where: { statut_paiement: 'paye' }, _sum: { montant_total_fcfa: true } }),
      prisma.triageIa.groupBy({ by: ['niveau_urgence'], _count: { _all: true } }),
    ]);

    res.json({
      success: true,
      data: {
        utilisateurs: Object.fromEntries(utilisateursParType.map(u => [u.type_utilisateur, u._count._all])),
        commandes: Object.fromEntries(commandesParStatut.map(c => [c.statut_commande, c._count._all])),
        consultations: {
          total: totalConsultations,
          par_type: Object.fromEntries(consultationsParType.map(c => [c.type_consultation, c._count._all])),
        },
        medicaments: totalMedicaments,
        pharmacies: totalPharmacies,
        ordonnances: totalOrdonnances,
        livreurs: totalLivreurs,
        chiffre_affaires_fcfa: caTotal._sum.montant_total_fcfa || 0,
        triages_par_urgence: Object.fromEntries(triagesParUrgence.map(t => [t.niveau_urgence, t._count._all])),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rapport financier : revenus, transactions, commissions livreurs.
 * Filtrable par période (?date_debut=...&date_fin=...).
 */
exports.getFinances = async (req, res, next) => {
  try {
    const { date_debut, date_fin, page = 1, limit = 20 } = req.query;

    const periode = {};
    if (date_debut) periode.gte = new Date(date_debut);
    if (date_fin) periode.lte = new Date(date_fin);
    const whereDate = Object.keys(periode).length ? { date_commande: periode } : {};

    const [revenus, parModePaiement, commissions, transactions, totalTransactions] = await Promise.all([
      prisma.commande.aggregate({
        where: { statut_paiement: 'paye', ...whereDate },
        _sum: { montant_total_fcfa: true },
        _count: { _all: true },
      }),
      prisma.commande.groupBy({
        by: ['mode_paiement'],
        where: { statut_paiement: 'paye', ...whereDate },
        _sum: { montant_total_fcfa: true },
        _count: { _all: true },
      }),
      prisma.livreur.aggregate({ _sum: { commission_totale_fcfa: true } }),
      prisma.commande.findMany({
        where: { statut_paiement: { in: ['paye', 'rembourse'] }, ...whereDate },
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { date_commande: 'desc' },
        select: {
          id_commande: true,
          montant_total_fcfa: true,
          statut_paiement: true,
          mode_paiement: true,
          date_commande: true,
          pharmacie: { select: { nom_pharmacie: true } },
        },
      }),
      prisma.commande.count({ where: { statut_paiement: { in: ['paye', 'rembourse'] }, ...whereDate } }),
    ]);

    res.json({
      success: true,
      data: {
        periode: { date_debut: date_debut || null, date_fin: date_fin || null },
        revenus_fcfa: revenus._sum.montant_total_fcfa || 0,
        nombre_commandes_payees: revenus._count._all,
        repartition_par_mode_paiement: parModePaiement.map(m => ({
          mode: m.mode_paiement,
          total_fcfa: m._sum.montant_total_fcfa,
          nombre: m._count._all,
        })),
        commissions_livreurs_fcfa: commissions._sum.commission_totale_fcfa || 0,
        transactions: { data: transactions, total: totalTransactions, page: Number(page), limit: Number(limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Journal d'audit : consultation des actions sensibles enregistrées.
 */
exports.getAudit = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, action, id_utilisateur, date_debut, date_fin } = req.query;

    const where = {};
    if (action) where.action = action;
    if (id_utilisateur) where.id_utilisateur = id_utilisateur;
    if (date_debut || date_fin) {
      where.date_action = {};
      if (date_debut) where.date_action.gte = new Date(date_debut);
      if (date_fin) where.date_action.lte = new Date(date_fin);
    }

    const [data, total] = await Promise.all([
      prisma.journalAudit.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { date_action: 'desc' },
        include: { utilisateur: { select: { nom: true, prenom: true, email: true, type_utilisateur: true } } },
      }),
      prisma.journalAudit.count({ where }),
    ]);

    res.json({ success: true, data: { data, total, page: Number(page), limit: Number(limit) } });
  } catch (error) {
    next(error);
  }
};

/**
 * Détection d'activités suspectes :
 * - rafales d'échecs de connexion (>= 5 en 24h) par utilisateur ou par IP
 * - comptes suspendus ayant tenté de se connecter
 */
exports.getActivitesSuspectes = async (req, res, next) => {
  try {
    const depuis = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const echecs = await prisma.journalAudit.findMany({
      where: { action: 'LOGIN_ECHEC', date_action: { gte: depuis } },
      orderBy: { date_action: 'desc' },
    });

    const parIp = {};
    const parEmail = {};
    for (const e of echecs) {
      if (e.adresse_ip) parIp[e.adresse_ip] = (parIp[e.adresse_ip] || 0) + 1;
      const email = e.details?.email;
      if (email) parEmail[email] = (parEmail[email] || 0) + 1;
    }

    const seuil = 5;
    const ipsSuspectes = Object.entries(parIp).filter(([, n]) => n >= seuil).map(([ip, n]) => ({ adresse_ip: ip, echecs_24h: n }));
    const comptesCibles = Object.entries(parEmail).filter(([, n]) => n >= seuil).map(([email, n]) => ({ email, echecs_24h: n }));

    const comptesSuspendus = await prisma.utilisateur.findMany({
      where: { statut_compte: { in: ['suspendu', 'desactive'] } },
      select: { id_utilisateur: true, email: true, type_utilisateur: true, statut_compte: true, derniere_connexion: true },
    });

    res.json({
      success: true,
      data: {
        seuil_echecs: seuil,
        ips_suspectes: ipsSuspectes,
        comptes_cibles_par_bruteforce: comptesCibles,
        comptes_suspendus: comptesSuspendus,
        total_echecs_connexion_24h: echecs.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Suspension / réactivation d'un compte utilisateur.
 */
exports.setStatutCompte = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { statut_compte } = req.body;

    if (!['actif', 'suspendu', 'desactive'].includes(statut_compte)) {
      throw new ValidationError('statut_compte invalide (actif | suspendu | desactive)');
    }

    const utilisateur = await prisma.utilisateur.findUnique({ where: { id_utilisateur: id } });
    if (!utilisateur) throw new NotFoundError('Utilisateur');

    const updated = await prisma.utilisateur.update({
      where: { id_utilisateur: id },
      data: { statut_compte },
    });

    logAction({ id_utilisateur: req.user.id, action: 'CHANGEMENT_STATUT_COMPTE', ressource: 'utilisateur', id_ressource: id, details: { nouveau_statut: statut_compte }, req });

    const { mot_de_passe_hash, ...safe } = updated;
    res.json({ success: true, message: `Compte ${statut_compte}`, data: safe });
  } catch (error) {
    next(error);
  }
};
