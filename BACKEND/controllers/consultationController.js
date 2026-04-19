const { NotFoundError } = require('../errors/AppError');
const { prisma } = require('../services/database');

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, id_patient, id_professionnel, statut } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (id_patient) where.id_patient = id_patient;
    if (id_professionnel) where.id_professionnel = id_professionnel;
    if (statut) where.statut = statut;

    const [data, total] = await Promise.all([
      prisma.consultation.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          patient: { include: { utilisateur: true } },
          professionnel: { include: { utilisateur: true } },
        },
        orderBy: { date_consultation: 'desc' },
      }),
      prisma.consultation.count({ where }),
    ]);

    res.json({ success: true, data: { data, total, page: Number(page), limit: Number(limit) } });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const consultation = await prisma.consultation.findUnique({
      where: { id_consultation: req.params.id },
      include: {
        patient: true,
        professionnel: true,
        carnet: true,
        ordonnances: true,
      },
    });
    if (!consultation) throw new NotFoundError('Consultation');
    res.json({ success: true, data: consultation });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const consultation = await prisma.consultation.create({ data: req.body });
    res.status(201).json({ success: true, data: consultation });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const consultation = await prisma.consultation.update({
      where: { id_consultation: req.params.id },
      data: req.body,
    });
    res.json({ success: true, data: consultation });
  } catch (error) {
    next(error);
  }
};
