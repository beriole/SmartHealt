const { NotFoundError, ForbiddenError } = require('../errors/AppError');
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
    const data = { ...req.body };
    if (data.latitude) data.latitude = Number(data.latitude);
    if (data.longitude) data.longitude = Number(data.longitude);
    if (data.livraison_disponible === 'true') data.livraison_disponible = true;
    if (data.livraison_disponible === 'false') data.livraison_disponible = false;
    if (data.rayon_livraison_km) data.rayon_livraison_km = Number(data.rayon_livraison_km);

    if (req.file) {
      data.image_url = `/uploads/${req.file.filename}`;
    }

    const pharmacie = await prisma.pharmacie.create({ data });
    res.status(201).json({ success: true, data: pharmacie });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const id = req.params.id;
    const pharmacieExistante = await prisma.pharmacie.findUnique({
      where: { id_pharmacie: id }
    });

    if (!pharmacieExistante) throw new NotFoundError('Pharmacie');

    // Vérification : Un pharmacien ne peut modifier que sa propre pharmacie
    if (req.user.type === 'PHARMACIEN' && pharmacieExistante.id_responsable !== req.user.id) {
      throw new ForbiddenError('Vous ne pouvez modifier que votre propre pharmacie');
    }

    const data = { ...req.body };
    // Conversion des types si envoyés via FormData
    if (data.latitude) data.latitude = Number(data.latitude);
    if (data.longitude) data.longitude = Number(data.longitude);
    if (data.livraison_disponible === 'true') data.livraison_disponible = true;
    if (data.livraison_disponible === 'false') data.livraison_disponible = false;
    if (data.rayon_livraison_km) data.rayon_livraison_km = Number(data.rayon_livraison_km);

    if (req.file) {
      data.image_url = `/uploads/${req.file.filename}`;
    }

    const pharmacie = await prisma.pharmacie.update({
      where: { id_pharmacie: id },
      data,
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

