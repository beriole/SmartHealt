const { prisma } = require('../services/database');
const { NotFoundError, ForbiddenError } = require('../errors/AppError');

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

    const stock = await prisma.stockPharmacie.create({
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

    const data = { ...req.body };
    if (data.quantite_disponible) data.quantite_disponible = Number(data.quantite_disponible);
    if (data.prix_vente_fcfa) data.prix_vente_fcfa = Number(data.prix_vente_fcfa);
    if (data.date_peremption) data.date_peremption = new Date(data.date_peremption);
    if (data.seuil_alerte) data.seuil_alerte = Number(data.seuil_alerte);

    const stock = await prisma.stockPharmacie.update({
      where: { id_stock: id },
      data,
      include: { medicament: true }
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

    await prisma.stockPharmacie.delete({ where: { id_stock: id } });

    res.json({ success: true, message: 'Médicament retiré du stock avec succès' });
  } catch (error) {
    next(error);
  }
};
