const { NotFoundError } = require('../errors/AppError');
const { prisma } = require('../services/database');

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, recherche, livraison_disponible } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (recherche) where.nom_pharmacie = { contains: recherche, mode: 'insensitive' };
    if (livraison_disponible !== undefined) {
      where.livraison_disponible = livraison_disponible === 'true';
    }

    const [data, total] = await Promise.all([
      prisma.pharmacie.findMany({
        where,
        skip,
        take: limit,
        include: { responsable: true },
        orderBy: { nom_pharmacie: 'asc' },
      }),
      prisma.pharmacie.count({ where }),
    ]);

    res.json({ success: true, data: { data, total, page: Number(page), limit: Number(limit) } });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const pharmacie = await prisma.pharmacie.findUnique({
      where: { id_pharmacie: req.params.id },
      include: { responsable: true, stocks: { include: { medicament: true } } },
    });
    if (!pharmacie) throw new NotFoundError('Pharmacie');
    res.json({ success: true, data: pharmacie });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const pharmacie = await prisma.pharmacie.create({ data: req.body });
    res.status(201).json({ success: true, data: pharmacie });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const pharmacie = await prisma.pharmacie.update({
      where: { id_pharmacie: req.params.id },
      data: req.body,
    });
    res.json({ success: true, data: pharmacie });
  } catch (error) {
    next(error);
  }
};

exports.evaluateOrdonnance = async (req, res, next) => {
  try {
    const { id: id_pharmacie, id_ordonnance } = req.params;

    const ordonnance = await prisma.ordonnance.findUnique({
      where: { id_ordonnance },
      include: { lignes: { include: { medicament: true } } }
    });

    if (!ordonnance) throw new NotFoundError('Ordonnance introuvable');

    const evaluation = {
      lignes: [],
      prix_total_produits: 0,
      disponibilite_complete: true,
      medicaments_manquants: []
    };

    for (const ligne of ordonnance.lignes) {
      const stock = await prisma.stockPharmacie.findFirst({
        where: {
          id_pharmacie,
          id_medicament: ligne.id_medicament,
          quantite_disponible: { gte: ligne.quantite }
        }
      });

      if (stock) {
        const sousTotal = Number(stock.prix_vente_fcfa) * ligne.quantite;
        evaluation.lignes.push({
          id_medicament: ligne.id_medicament,
          nom: ligne.medicament.nom_commercial,
          quantite: ligne.quantite,
          disponible: true,
          prix_unitaire: stock.prix_vente_fcfa,
          sous_total: sousTotal,
          id_stock: stock.id_stock
        });
        evaluation.prix_total_produits += sousTotal;
      } else {
        evaluation.disponibilite_complete = false;
        evaluation.medicaments_manquants.push(ligne.medicament.nom_commercial);
        evaluation.lignes.push({
          id_medicament: ligne.id_medicament,
          nom: ligne.medicament.nom_commercial,
          quantite: ligne.quantite,
          disponible: false
        });
      }
    }

    res.json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    next(error);
  }
};

