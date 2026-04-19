const { NotFoundError } = require('../errors/AppError');
const { prisma } = require('../services/database');

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, id_patient, niveau_urgence } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (id_patient) where.id_patient = id_patient;
    if (niveau_urgence) where.niveau_urgence = niveau_urgence;

    const [data, total] = await Promise.all([
      prisma.triageIa.findMany({
        where,
        skip,
        take: Number(limit),
        include: { patient: { include: { utilisateur: true } } },
        orderBy: { date_session: 'desc' },
      }),
      prisma.triageIa.count({ where }),
    ]);

    res.json({ success: true, data: { data, total, page: Number(page), limit: Number(limit) } });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const triage = await prisma.triageIa.findUnique({
      where: { id_triage: req.params.id },
      include: { patient: { include: { utilisateur: true } } },
    });

    if (!triage) throw new NotFoundError('Triage IA');
    res.json({ success: true, data: triage });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const triage = await prisma.triageIa.create({ data: req.body });
    res.status(201).json({ success: true, data: triage });
  } catch (error) {
    next(error);
  }
};

exports.updateSuivi = async (req, res, next) => {
  try {
    const triage = await prisma.triageIa.update({
      where: { id_triage: req.params.id },
      data: { suivi_pris: true },
    });
    res.json({ success: true, data: triage });
  } catch (error) {
    next(error);
  }
};
