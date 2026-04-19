const { NotFoundError } = require('../errors/AppError');
const { prisma } = require('../services/database');

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, id_patient, statut } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (id_patient) where.id_patient = id_patient;
    if (statut) where.statut = statut;

    const [data, total] = await Promise.all([
      prisma.ordonnance.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          patient: true,
          professionnel: true,
          lignes: { include: { medicament: true } },
        },
        orderBy: { date_emission: 'desc' },
      }),
      prisma.ordonnance.count({ where }),
    ]);

    res.json({ success: true, data: { data, total, page: Number(page), limit: Number(limit) } });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const ordonnance = await prisma.ordonnance.findUnique({
      where: { id_ordonnance: req.params.id },
      include: {
        patient: true,
        professionnel: true,
        consultation: true,
        lignes: { include: { medicament: true } },
      },
    });
    if (!ordonnance) throw new NotFoundError('Ordonnance');
    res.json({ success: true, data: ordonnance });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { lignes, ...ordonnanceData } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const ordonnance = await tx.ordonnance.create({ data: ordonnanceData });

      if (lignes && lignes.length > 0) {
        await tx.ligneOrdonnance.createMany({
          data: lignes.map((ligne) => ({
            ...ligne,
            id_ordonnance: ordonnance.id_ordonnance,
          })),
        });
      }

      return ordonnance;
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { lignes, ...ordonnanceData } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const ordonnance = await tx.ordonnance.update({
        where: { id_ordonnance: req.params.id },
        data: ordonnanceData,
      });

      if (lignes) {
        await tx.ligneOrdonnance.deleteMany({ where: { id_ordonnance: req.params.id } });
        if (lignes.length > 0) {
          await tx.ligneOrdonnance.createMany({
            data: lignes.map((ligne) => ({ ...ligne, id_ordonnance: req.params.id })),
          });
        }
      }

      return ordonnance;
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
