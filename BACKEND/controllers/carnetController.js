const { NotFoundError } = require('../errors/AppError');
const { prisma } = require('../services/database');

exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, id_patient } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (id_patient) where.id_patient = id_patient;

    const [data, total] = await Promise.all([
      prisma.carnetSante.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          patient: { include: { utilisateur: true } },
          consultations: true,
        },
        orderBy: { date_creation: 'desc' },
      }),
      prisma.carnetSante.count({ where }),
    ]);

    res.json({ success: true, data: { data, total, page: Number(page), limit: Number(limit) } });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const carnet = await prisma.carnetSante.findUnique({
      where: { id_carnet: req.params.id },
      include: {
        patient: { include: { utilisateur: true } },
        consultations: {
          include: { professionnel: { include: { utilisateur: true } } },
          orderBy: { date_consultation: 'desc' },
        },
        acces: { orderBy: { date_acces: 'desc' } },
      },
    });

    if (!carnet) throw new NotFoundError('Carnet de santé');
    res.json({ success: true, data: carnet });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { vaccinations, acces_actif, qr_code_token } = req.body;

    const carnet = await prisma.carnetSante.update({
      where: { id_carnet: req.params.id },
      data: { vaccinations, acces_actif, qr_code_token },
    });

    res.json({ success: true, data: carnet });
  } catch (error) {
    next(error);
  }
};
