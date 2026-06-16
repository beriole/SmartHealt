const { prisma } = require('../services/database');
const { NotFoundError, ForbiddenError } = require('../errors/AppError');

// Récupère la pharmacie du pharmacien connecté (ou null pour un admin)
async function getPharmacieDuResponsable(userId) {
  return prisma.pharmacie.findFirst({ where: { id_responsable: userId } });
}

exports.searchGlobalStock = async (req, res, next) => {
  try {
    const { medicament, sort = 'price' } = req.query;

    if (!medicament) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez préciser un nom de médicament ou un ID.'
      });
    }

    // Recherche par nom commercial ou DCI
    const stocks = await prisma.stockPharmacie.findMany({
      where: {
        medicament: {
          OR: [
            { nom_commercial: { contains: medicament, mode: 'insensitive' } },
            { dci: { contains: medicament, mode: 'insensitive' } },
            { id_medicament: medicament }
          ]
        },
        quantite_disponible: { gt: 0 },
        pharmacie: { statut: 'active' }
      },
      include: {
        medicament: true,
        pharmacie: {
          select: {
            id_pharmacie: true,
            nom_pharmacie: true,
            adresse: true,
            telephone: true,
            note_moyenne: true,
            latitude: true,
            longitude: true,
            livraison_disponible: true
          }
        }
      },
      orderBy: sort === 'price' ? { prix_vente_fcfa: 'asc' } : undefined
    });

    // Si le tri n'est pas par prix, on peut trier par note moyenne de la pharmacie manuellement ou via prisma
    if (sort === 'rating') {
      stocks.sort((a, b) => b.pharmacie.note_moyenne - a.pharmacie.note_moyenne);
    }

    res.json({
      success: true,
      count: stocks.length,
      data: stocks
    });
  } catch (error) {
    next(error);
  }
};
exports.getMyStocks = async (req, res, next) => {
  try {
    const pharmacie = await prisma.pharmacie.findFirst({
      where: { id_responsable: req.user.id }
    });

    if (!pharmacie) throw new NotFoundError('Pharmacie pour ce responsable');

    const stocks = await prisma.stockPharmacie.findMany({
      where: { id_pharmacie: pharmacie.id_pharmacie },
      include: { medicament: true },
      orderBy: { medicament: { nom_commercial: 'asc' } }
    });

    res.json({ success: true, count: stocks.length, data: stocks });
  } catch (error) {
    next(error);
  }
};

exports.createStock = async (req, res, next) => {
  try {
    const { id_medicament, quantite_disponible, prix_vente_fcfa, date_peremption, seuil_alerte } = req.body;
    let { id_pharmacie } = req.body;

    // Si c'est un pharmacien, on force l'ID de sa propre pharmacie
    if (req.user.type === 'PHARMACIEN') {
      const pharmacie = await prisma.pharmacie.findFirst({ where: { id_responsable: req.user.id } });
      if (!pharmacie) throw new ForbiddenError('Aucune pharmacie associée à votre compte');
      id_pharmacie = pharmacie.id_pharmacie;
    }

    if (!id_pharmacie) throw new ForbiddenError('ID Pharmacie requis');

    const stock = await prisma.$transaction(async (tx) => {
      const created = await tx.stockPharmacie.create({
        data: {
          id_pharmacie,
          id_medicament,
          quantite_disponible: Number(quantite_disponible),
          prix_vente_fcfa: Number(prix_vente_fcfa),
          date_peremption: date_peremption ? new Date(date_peremption) : null,
          seuil_alerte: seuil_alerte ? Number(seuil_alerte) : 10
        },
        include: { medicament: true }
      });

      await tx.mouvementStock.create({
        data: {
          id_stock: created.id_stock,
          type_mouvement: 'entree',
          quantite: Number(quantite_disponible),
          quantite_avant: 0,
          quantite_apres: Number(quantite_disponible),
          motif: 'Création du stock',
          id_utilisateur: req.user.id,
        },
      });

      return created;
    });

    res.status(201).json({ success: true, data: stock });
  } catch (error) {
    next(error);
  }
};

exports.updateStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const stockExistant = await prisma.stockPharmacie.findUnique({
      where: { id_stock: id },
      include: { pharmacie: true }
    });

    if (!stockExistant) throw new NotFoundError('Stock');

    // Sécurité : Vérifier si le pharmacien est bien le responsable
    if (req.user.type === 'PHARMACIEN' && stockExistant.pharmacie.id_responsable !== req.user.id) {
      throw new ForbiddenError('Vous ne pouvez pas modifier ce stock');
    }

    const data = {};
    // Whitelist des champs modifiables
    if (req.body.quantite_disponible !== undefined) data.quantite_disponible = Number(req.body.quantite_disponible);
    if (req.body.prix_vente_fcfa !== undefined) data.prix_vente_fcfa = Number(req.body.prix_vente_fcfa);
    if (req.body.date_peremption !== undefined) data.date_peremption = req.body.date_peremption ? new Date(req.body.date_peremption) : null;
    if (req.body.seuil_alerte !== undefined) data.seuil_alerte = Number(req.body.seuil_alerte);

    const stock = await prisma.$transaction(async (tx) => {
      const updated = await tx.stockPharmacie.update({
        where: { id_stock: id },
        data,
        include: { medicament: true }
      });

      // Traçabilité si la quantité a changé (ajustement manuel)
      if (data.quantite_disponible !== undefined && data.quantite_disponible !== stockExistant.quantite_disponible) {
        const delta = data.quantite_disponible - stockExistant.quantite_disponible;
        await tx.mouvementStock.create({
          data: {
            id_stock: id,
            type_mouvement: 'ajustement',
            quantite: Math.abs(delta),
            quantite_avant: stockExistant.quantite_disponible,
            quantite_apres: data.quantite_disponible,
            motif: req.body.motif || 'Ajustement manuel',
            id_utilisateur: req.user.id,
          },
        });
      }

      return updated;
    });

    res.json({ success: true, data: stock });
  } catch (error) {
    next(error);
  }
};

exports.deleteStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const stockExistant = await prisma.stockPharmacie.findUnique({
      where: { id_stock: id },
      include: { pharmacie: true }
    });

    if (!stockExistant) throw new NotFoundError('Stock');

    if (req.user.type === 'PHARMACIEN' && stockExistant.pharmacie.id_responsable !== req.user.id) {
      throw new ForbiddenError('Vous ne pouvez pas supprimer ce stock');
    }

    await prisma.$transaction(async (tx) => {
      // Solde le stock à zéro avant suppression pour garder une trace cohérente
      if (stockExistant.quantite_disponible > 0) {
        await tx.mouvementStock.create({
          data: {
            id_stock: id,
            type_mouvement: 'sortie',
            quantite: stockExistant.quantite_disponible,
            quantite_avant: stockExistant.quantite_disponible,
            quantite_apres: 0,
            motif: req.body?.motif || 'Retrait du stock du catalogue',
            id_utilisateur: req.user.id,
          },
        });
      }
      await tx.mouvementStock.deleteMany({ where: { id_stock: id } });
      await tx.stockPharmacie.delete({ where: { id_stock: id } });
    });

    res.json({ success: true, message: 'Médicament retiré du stock avec succès' });
  } catch (error) {
    next(error);
  }
};

/**
 * Alertes de stock pour la pharmacie du pharmacien connecté :
 * - ruptures (quantité <= seuil d'alerte)
 * - péremptions proches (< 90 jours) ou dépassées
 */
exports.getAlertes = async (req, res, next) => {
  try {
    const pharmacie = await getPharmacieDuResponsable(req.user.id);
    if (!pharmacie && req.user.type !== 'ADMIN') throw new NotFoundError('Pharmacie pour ce responsable');

    const wherePharmacie = pharmacie ? { id_pharmacie: pharmacie.id_pharmacie } : {};
    const dans90Jours = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const stocks = await prisma.stockPharmacie.findMany({
      where: wherePharmacie,
      include: { medicament: true, pharmacie: { select: { nom_pharmacie: true } } },
    });

    const ruptures = stocks.filter(s => s.quantite_disponible <= s.seuil_alerte);
    const peremptions = stocks.filter(s => s.date_peremption && s.date_peremption <= dans90Jours);

    res.json({
      success: true,
      data: {
        ruptures: ruptures.map(s => ({
          id_stock: s.id_stock,
          medicament: s.medicament.nom_commercial,
          quantite_disponible: s.quantite_disponible,
          seuil_alerte: s.seuil_alerte,
        })),
        peremptions: peremptions.map(s => ({
          id_stock: s.id_stock,
          medicament: s.medicament.nom_commercial,
          date_peremption: s.date_peremption,
          deja_perime: s.date_peremption < new Date(),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Historique des mouvements d'un stock (entrées, ventes, retours, ajustements).
 */
exports.getMouvements = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const stock = await prisma.stockPharmacie.findUnique({
      where: { id_stock: id },
      include: { pharmacie: true, medicament: true },
    });
    if (!stock) throw new NotFoundError('Stock');

    if (req.user.type === 'PHARMACIEN' && stock.pharmacie.id_responsable !== req.user.id) {
      throw new ForbiddenError('Vous ne pouvez pas consulter ce stock');
    }

    const [mouvements, total] = await Promise.all([
      prisma.mouvementStock.findMany({
        where: { id_stock: id },
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { date_mouvement: 'desc' },
        include: { utilisateur: { select: { nom: true, prenom: true, type_utilisateur: true } } },
      }),
      prisma.mouvementStock.count({ where: { id_stock: id } }),
    ]);

    res.json({
      success: true,
      data: { medicament: stock.medicament.nom_commercial, mouvements, total, page: Number(page), limit: Number(limit) },
    });
  } catch (error) {
    next(error);
  }
};
