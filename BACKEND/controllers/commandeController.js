const { NotFoundError } = require('../errors/AppError');
const { prisma } = require('../services/database');

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, id_patient, id_pharmacie, statut_commande } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (id_patient) where.id_patient = id_patient;
    if (id_pharmacie) where.id_pharmacie = id_pharmacie;
    if (statut_commande) where.statut_commande = statut_commande;

    const [data, total] = await Promise.all([
      prisma.commande.findMany({
        where,
        skip,
        take: Number(limit),
        include: { patient: true, pharmacie: true, lignes: true },
        orderBy: { date_commande: 'desc' },
      }),
      prisma.commande.count({ where }),
    ]);

    res.json({ success: true, data: { data, total, page: Number(page), limit: Number(limit) } });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const commande = await prisma.commande.findUnique({
      where: { id_commande: req.params.id },
      include: {
        patient: true,
        pharmacie: true,
        lignes: { include: { stock: { include: { medicament: true } } } },
      },
    });
    if (!commande) throw new NotFoundError('Commande');
    res.json({ success: true, data: commande });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { lignes, ...commandeData } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const commande = await tx.commande.create({ data: commandeData });

      if (lignes && lignes.length > 0) {
        let montantTotal = 0;

        for (const ligne of lignes) {
          const stock = await tx.stockPharmacie.findUnique({
            where: { id_stock: ligne.id_stock },
          });

          if (!stock) throw new NotFoundError('Stock');

          const sousTotal = Number(stock.prix_vente_fcfa) * ligne.quantite_commandee;
          montantTotal += sousTotal;

          await tx.ligneCommande.create({
            data: {
              id_commande: commande.id_commande,
              id_stock: ligne.id_stock,
              quantite_commandee: ligne.quantite_commandee,
              prix_unitaire_fcfa: stock.prix_vente_fcfa,
              sous_total_fcfa: sousTotal,
            },
          });
        }

        await tx.commande.update({
          where: { id_commande: commande.id_commande },
          data: { montant_total_fcfa: montantTotal },
        });
      }

      return commande;
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const commande = await prisma.commande.update({
      where: { id_commande: req.params.id },
      data: req.body,
    });
    res.json({ success: true, data: commande });
  } catch (error) {
    next(error);
  }
};
