const { NotFoundError } = require('../errors/AppError');
const { prisma } = require('../services/database');

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, categorie, recherche } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (categorie) where.categorie = categorie;
    if (recherche) {
      where.OR = [
        { nom_commercial: { contains: recherche, mode: 'insensitive' } },
        { dci: { contains: recherche, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.medicament.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nom_commercial: 'asc' },
      }),
      prisma.medicament.count({ where }),
    ]);

    res.json({ success: true, data: { data, total, page: Number(page), limit: Number(limit) } });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const medicament = await prisma.medicament.findUnique({
      where: { id_medicament: req.params.id },
    });
    if (!medicament) throw new NotFoundError('Médicament');
    res.json({ success: true, data: medicament });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const medicament = await prisma.medicament.create({ data: req.body });
    res.status(201).json({ success: true, data: medicament });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const medicament = await prisma.medicament.update({
      where: { id_medicament: req.params.id },
      data: req.body,
    });
    res.json({ success: true, data: medicament });
  } catch (error) {
    next(error);
  }
};
