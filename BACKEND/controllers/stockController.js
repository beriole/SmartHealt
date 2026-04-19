const { prisma } = require('../services/database');
const { NotFoundError } = require('../errors/AppError');

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
