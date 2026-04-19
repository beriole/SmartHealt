const { NotFoundError, ForbiddenError } = require('../errors/AppError');
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
    // Identification automatique du médecin via son token
    const professionnel = await prisma.professionnelSante.findUnique({
      where: { id_utilisateur: req.user.id }
    });

    if (!professionnel) {
      throw new ForbiddenError('Profil Professionnel de Santé introuvable ou non autorisé.');
    }

    const { id_patient, id_carnet } = req.body;

    // Vérification de sécurité: Le carnet fourni appartient-il bien au patient mentionné ?
    const carnet = await prisma.carnetSante.findUnique({ where: { id_patient } });
    if (!carnet || carnet.id_carnet !== id_carnet) {
      throw new NotFoundError('Incohérence : Ce carnet n\'appartient pas à ce patient.');
    }

    const consultationData = {
      ...req.body,
      id_professionnel: professionnel.id_professionnel,
    };

    const consultation = await prisma.consultation.create({ data: consultationData });
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
