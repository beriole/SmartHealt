const { NotFoundError } = require('../errors/AppError');
const { prisma } = require('../services/database');

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, specialite, statut_verification, disponible_domicile } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (specialite) where.specialite = specialite;
    if (statut_verification) where.statut_verification = statut_verification;
    if (disponible_domicile !== undefined) {
      where.disponible_domicile = disponible_domicile === 'true';
    }

    const [data, total] = await Promise.all([
      prisma.professionnelSante.findMany({
        where,
        skip,
        take: Number(limit),
        include: { utilisateur: true },
        orderBy: { note_moyenne: 'desc' },
      }),
      prisma.professionnelSante.count({ where }),
    ]);

    res.json({ success: true, data: { data, total, page: Number(page), limit: Number(limit) } });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const professionnel = await prisma.professionnelSante.findUnique({
      where: { id_professionnel: req.params.id },
      include: {
        utilisateur: true,
        consultations: { take: 10, orderBy: { date_consultation: 'desc' } },
      },
    });

    if (!professionnel) throw new NotFoundError('Professionnel');
    res.json({ success: true, data: professionnel });
  } catch (error) {
    next(error);
  }
};
