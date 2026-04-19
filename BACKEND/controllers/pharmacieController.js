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
